from typing import Tuple, Optional, List

import boto3
import re
from typing import List, Tuple
from langchain_core.messages import HumanMessage
import os
from langchain_aws import ChatBedrock
from elasticsearch import Elasticsearch
import random

ELASTIC_HOST = "http://localhost:9200"
es = Elasticsearch(ELASTIC_HOST)


def validate_regex_pattern_with_llm(
    regex: str, text: str, class_structure: List[str], llm, max_test_chars: int = 5000
) -> Tuple[bool, Optional[str]]:
    """
    Ask the LLM to validate whether the given regex splits the text into valid chunks,
    each containing all required fields from the class structure.

    Returns:
        - (True, None) if valid
        - (False, reason) if invalid, with reason string for feedback
    """
    sample_text = text[:max_test_chars]
    required_fields_str = ", ".join(class_structure)

    prompt = f"""
        You are a highly precise language model specializing in regex validation and structured data extraction.

        Task:
        - A regex pattern was generated to split a document into chunks.
        - Each chunk is expected to represent one complete record that includes the following fields:
        {required_fields_str}

        Here’s the Python regex pattern:
        {regex}

        Here is the sample document text:
        {sample_text}


        Instructions:
        - Apply the regex to the document.
        - Check if the resulting chunks contain **all required fields**.
        - Return `True` if the pattern works well.
        - Otherwise, return `False` and provide a short explanation why the regex is flawed.

        ### Output Format:
        Return `True` or `False: <reason>`, nothing else.
        """

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        result = (
            response.content.strip()
            if hasattr(response, "content")
            else response.strip()
        )

        print(f"🧠 LLM validation response: {result}")

        if result.lower().startswith("true"):
            return True, None
        elif result.lower().startswith("false"):
            reason = result.partition(":")[2].strip() or "No reason provided."
            return False, reason
        else:
            print("⚠️ Unexpected response format. Assuming invalid.")
            return False, result

    except Exception as e:
        print(f"❌ LLM validation failed: {e}")
        return False, f"Exception during validation: {e}"


def sample_pages_by_offset(
    index_name: str, sample_count: int = 3, keywords: List[str] = []
) -> List[str]:
    if not keywords:
        # === 🔹 Sample from all documents ===
        count_result = es.count(index=index_name)
        total_docs = count_result["count"]

        if total_docs == 0:
            return []

        offsets = random.sample(range(total_docs), min(sample_count, total_docs))

        sampled_docs = []
        for offset in offsets:
            res = es.search(
                index=index_name,
                body={"from": offset, "size": 1, "query": {"match_all": {}}},
            )

            hits = res["hits"]["hits"]
            if hits:
                sampled_docs.append(hits[0]["_source"].get("content", ""))
        return sampled_docs
    else:
        # === 🔹 Sample from documents matching keywords ===
        query_text = " ".join(keywords)
        print("🔍 Performing keyword-based search in Elasticsearch...")
        query = {
            "query": {"match": {"content": {"query": query_text, "operator": "and"}}}
        }

        response = es.search(index=index_name, body=query, size=1000)
        hits = response["hits"]["hits"]

        if not hits:
            return []

        sampled_hits = random.sample(hits, min(sample_count, len(hits)))
        return [hit["_source"].get("content", "") for hit in sampled_hits]


def infer_split_regex(
    class_structure: str,
    llm,
) -> Optional[str]:
    pages = sample_pages_by_offset("kw24abstracts-1-20-1", sample_count=5)

    """
    Uses an LLM to infer a regex pattern to split a document into chunks matching a given Pydantic class.
    Tries up to `max_attempts` and feeds back failed regex patterns for improvement.
    """
    previous_pattern = None
    reason = None
    patterns: List[str] = []

    for i, page in enumerate(pages):
        print(f"\n🔁 Attempt {i} to infer regex...")

        feedback = (
            f"\nHere was the previous regexs from other pages with some document:\n{patterns}\n"
            "make regex which support all those page it will be general for all user regexs share above"
            if patterns
            else ""
        )

        prompt = f"""
                You are an expert in analyzing unstructured text to extract structured records.

                ## Goal:
                Analyze the sample input text and identify the optimal boundary **string or pattern** to use with Python's `re.split()` so that **each resulting chunk will contain one full logical record** matching the fields in the given class structure.

                ## Requirements:
                - Carefully examine the class structure to understand what fields must be present in each complete record.
                - Infer a **distinctive, recurring pattern** in the input text that marks the start of a new record (e.g., titles, session headers, section dividers, IDs, etc.).
                - Return only the **Python regex pattern** that can be used with `re.split()` to split the input into logical chunks.
                - The pattern should be **strongly anchored** (e.g., look for section headers, abstract types, unique codes like `TH-OR01`, etc.).
                - Your output must be a **raw regex pattern** inside triple backticks — no extra comments or markdown.

                ## Class Structure:
                {class_structure}

                ## Sample Input Text:
                {page}

                ## Output:
                A single valid Python regex pattern to split the text into chunks containing one complete record each.

                {feedback}

                """

        # print(prompt)
        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            raw_output = response.content if hasattr(response, "content") else response
            print("🧠 LLM raw regex response:\n", raw_output)

            match = re.search(r"```(?:python)?\s*(.+?)\s*```", raw_output, re.DOTALL)
            if match:
                previous_pattern = match.group(1).strip()
                print("✅ Inferred regex pattern:", previous_pattern)
                patterns.append(previous_pattern)

            else:
                print("⚠️ Could not extract regex pattern. Will retry...")
                previous_pattern = raw_output.strip()
        except Exception as e:
            print(f"❌ LLM regex generation failed: {e}")
            break

    print("⛔ All attempts to generate a regex pattern failed.")
    return previous_pattern


large_abstract_text = """
TH-OR01  Oral Abstract  Thursday
Achieving More Equitable Kidney Care
Nonoptimal ESKD Starts before and after Medicaid Expansion
Nicholas S. Roetker,1 Jiannong Liu,1 Haifeng Guo,1 David T. Gilbertson,1,2 
James B. Wetmore,1,2 Kirsten L. Johansen.1,2 1Chronic Disease Research 
Group, Hennepin Healthcare Research Institute, Minneapolis, MN; 
2University of Minnesota Twin Cities, Minneapolis, MN.
Background: Initiating in-center hemodialysis with a central venous catheter 
represents a nonoptimal start of end-stage kidney disease (ESKD). We studied whether 
nonoptimal start rates were higher in residents of 11 states that did not expand Medicaid 
access in 2014 relative to residents of 27 states that did.
Methods: We included yearly data from 2006-2019 for persons aged 18-64 years. We 
identified age, sex, and race/ethnicity state-level population estimates using US Census 
Bureau data and counts of nonoptimal ESKD starts from the US Renal Data System. We 
compared incidence rates between expansion and non-expansion states in the pre- and 
post-expansion periods using age, sex, and race/ethnicity adjusted Poisson regression.
Results: Before Medicaid expansion, the yearly rate of nonoptimal ESKD starts 
was 216.8 cases per million persons (PMP) in non-expansion states and 199.3 PMP 
in expansion states, with rates decreasing in both groups across this period (Figure). 
After Medicaid expansion, nonoptimal start rates were relatively stable in the expansion 
states (191.2 cases PMP) but increased in the non-expansion states (216.9 cases PMP). 
Thus, compared with the expansion states, the average yearly incidence was 17.4 (95%  
CI 15.8–19.1) PMP higher in non-expansion states in the pre-expansion period and  
25.7 (95% CI 23.9–27.5) PMP higher in the post-expansion period (post vs pre difference 
in difference: 8.2; 95% CI 5.8–10.7 PMP). Notably, the difference in difference estimates 
were highest among the age 45-64 years (17.3; 95% CI 12.0–22.7 PMP) and non-Hispanic 
White (16.2; 95% CI 13.6–18.8 PMP) subgroups.
Conclusions: In the 6 years after enactment of the Affordable Care Act, rates 
of nonoptimal ESKD start were stable in states that expanded access to Medicaid but 
increased in states that did not. Further studies should examine whether increases in 
nonoptimal starts in non-expansion states may be attributable to less access to healthcare 
among uninsured persons with kidney disease.
Funding: NIDDK Support
TH-OR02  Oral Abstract  Thursday
Achieving More Equitable Kidney Care
Age-Dependent Racial Differences in Kidney Function Decline between 
Black and White Veterans after CKD Onset
Guofen Yan,1 Julia J. Scialla,1 Nan Hu,2 Wei Yu,1 Tom Greene,3 Robert Nee,4 
Fei Heng,5 Alfred K. Cheung,3 Keith C. Norris.6 1University of Virginia, 
Charlottesville, VA; 2Florida International University, Miami, FL; 3University  
of Utah Health, Salt Lake City, UT; 4Walter Reed National Military Medical 
Center, Bethesda, MD; 5University of North Florida, Jacksonville, FL; 6University  
of California Los Angeles David Geffen School of Medicine, Los Angeles, CA.
Background: Recent research reveals that, when CKD onset was determined using 
the new race-free eGFR equation, Black adults still had a higher risk of subsequent 
progression to kidney failure than their White peers. We examined the extent to which 
rates of eGFR decline over time differ in Black and White veterans after CKD onset, and 
whether age modified the racial difference.
Methods: The study included 54,728 non-Hispanic Black and 256,479 non-Hispanic 
White veterans, aged 18-85 years, with new onset of CKD between 2005 and 2012 in 
the US Veterans Health Administration, and quarterly eGFR measurements for up to  
6 years. eGFRs were calculated from outpatient serum creatinine measurements based on 
the 2021 CKD-EPI creatinine equation. We employed a linear spline mixed-effects model 
with random intercepts and random slopes to estimate age-specific rates of stable eGFR 
decline over 6 years from quarter 4 after CKD onset for each race, controlling for sex and 
calendar year of CKD onset.
Results: Upon CKD onset, the two race groups had similar mean eGFR levels 
(51 mL/min/1.73m2). The rate of eGFR decline accelerated as the age of CKD onset 
decreased in Black veterans; the reverse was observed in White veterans (Table). As a 
result, racial differences in eGFR slopes were modified by the age of CKD onset, with 
larger differences at younger onset of CKD. For example, at age of CKD onset of 45 years 
old, the rate of eGFR decline was 0.79 mL/min/1.73m2 per year faster in Black than White 
veterans. In distinct contrast, similar decline rates were observed in the two race groups 
at onset age of 85 years.
Conclusions: Racial differences in kidney function decline were larger among 
patients who developed CKD at a younger age, likely driven by more rapid decline in 
a subset of young Black patients. Delineating biological and social factors underlying 
the younger onset of CKD and subsequent fast progression for Black patients is 
warranted.
Funding: NIDDK Support
Age-specific rates of eGFR changes after CKD onset by race
A negative value means eGFR decline.
TH-OR03  Oral Abstract  Thursday
Achieving More Equitable Kidney Care
Impact of Predialysis Nephrology Care on Incident Vascular Access 
Outcome among Hispanic Individuals: A Causal Mediation Analysis
Grant D. Scheiffele,1 Serena Jingchuan Guo,2 Wenxi Huang Huang,2 Yi Guo,2 
Ashutosh M. Shukla.1,2 1US Department of Veterans Affairs, Gainesville, FL; 
2University of Florida, Gainesville, FL.
Background: Predialysis care is a dominant predictor of incident vascular access 
outcomes. Prior studies have shown significant disparities in predialysis nephrology care 
among Hispanic patients with ESKD, compared to non-Hispanic Whites; however, its 
relative contributions to disparities in vascular access outcomes is unknown.
Methods: Analyzing patients initiating hemodialysis between 2009 and 2019 in 
URSDS, we examined the impact of disparities in predialysis nephrology care on incident 
vascular access use among Hispanic individuals, compared to non-Hispanic White 
individuals. Adjusting for critical patient-level variables, we conducted series of logistic 
regression and causal mediation analyses to dissect the attributable influence of disparities 
in predialysis nephrology care on vascular access use.
Results: Among the 427,340 adult Medicare recipients initiating their first-ever 
hemodialysis between 2010-2019; 269,697 Non-Hispanic White and 46,146 Hispanic 
individuals, 276,652 initiated with pure central venous catheter (CVC) without any 
maturing Arteriovenous Fistula (AVF) or Arteriovenous Graft (AVG) and 75,238 
initiated with AVF or AVG. After adjusting for patient-level variables, compared to 
Non-Hispanic Whites, odds of predialysis nephrology care were 64% (95%CI: 63–66%) 
and odds of incident AVF/AVG use were 71% (95%CI:69-74%) amongst patients with 
Hispanic ethnicity. Causal mediation analysis showed that 33% (95%CI:29-37%) of 
the incident vascular access underuse was attributable to the disparities in predialysis 
renal care. Sensitivity analyses examining stronger mediators in form of more than 
6-month nephrology care and predialysis kidney disease education showed even stronger 
mediating influence on vascular access outcomes (Table 1).
Conclusions: Disparities in predialysis nephrology care mediate nearly a third of 
disparities in vascular access outcomes among Hispanic ESKD population. Efforts are 
needed to universalize predialysis nephrology care and kidney disease education services 
for all Hispanic individuals at high risk of kidney failure.
Funding: Veterans Affairs Support
"""
class_structure = {
    "class_name": "AbstractReport",
    "class_struture": "from pydantic import BaseModel, Field\nfrom typing import Optional\n\nclass AbstractReport(BaseModel):\n    abstract_number: str = Field(pattern=r'^[A-Za-z]{2}-[A-Za-z0-9]{4}$')\n    background: Optional[str] = None\n    method: Optional[str] = None\n    results: Optional[str] = None\n    funding: Optional[str] = None\n    conclusions: Optional[str] = None",
}


def get_bed_rock_object():

    bedrock_client = boto3.client(
        service_name="bedrock-runtime",
        region_name="eu-central-1",
        aws_access_key_id="",
        aws_secret_access_key="+",
        aws_session_token="",
    )
    return bedrock_client


bedrock_client = get_bed_rock_object()

llm = ChatBedrock(
    region_name="-1",
    client=bedrock_client,
    model_id="",
    streaming=True,
    # callbacks=[StreamingStdOutCallbackHandler()],
)

pattern = infer_split_regex(
    class_structure=class_structure["class_struture"],
    llm=llm,  # Claude or OpenAI wrapper
)

print("\n\n\n", pattern)
# # Now split text using the inferred regex
chunks = re.split(pattern, large_abstract_text, flags=re.MULTILINE)
# Rejoin properly if split was with lookahead
results = []
for i in range(0, len(chunks)):
    if chunks[i].strip():
        if i > 0 and not re.match(pattern, chunks[i]):
            results[-1] += "\n" + chunks[i]
        else:
            results.append(chunks[i])
print(len(results))
print("--------------------------------------------")

print(results[0])
print("--------------------------------------------")

print((results[2]))
# print("--------------------------------------------")

# is_valid, reason = validate_regex_pattern_with_llm("(?=TH-OR\d+\s+Oral Abstract\s+Thursday[\s\S]*?Background:)", large_abstract_text, class_structure, llm)
# if is_valid:
#     print("Regex valid, reason:", reason)
# else:
#     print("❌ Regex invalid, reason:", reason)
