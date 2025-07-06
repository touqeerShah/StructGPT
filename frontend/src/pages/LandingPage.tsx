import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion, useInView } from "framer-motion";
import useDarkMode from '../hooks/useDarkMode';
import LandingNav from '../components/LandingNav';
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";


import {
    Brain,
    Database,
    FileText,
    Zap,
    ArrowRight,
    Sparkles,
    BarChart3,
    FileJson,
    Globe,
    Shield,
    Upload,
    Activity,
    Code,
} from 'lucide-react';

interface LandingPageProps {
    user?: { email: string, name: string } | null;
    isAuthenticated: boolean;
  onLogout: () => void;
}


const LandingPage : React.FC<LandingPageProps> = ({
    user,
    isAuthenticated,
    onLogout
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const sectionRef = useRef(null);
    const inView = useInView(sectionRef, { once: false, amount: 0.4 }); // Triggers when 40% 
    const [darkMode, setDarkMode] = useDarkMode();
    const navigate = useNavigate();

    const structuredOutput = {
        contact: {
            name: "John Smith",
            email: "john@company.com",
            phone: "555-0123"
        },
        lead_info: {
            interest: "enterprise plan",
            budget: 50000,
            status: "qualified"
        },
        next_action: {
            type: "meeting",
            date: "2024-01-02T14:00:00Z",
            follow_up: ["contract terms"]
        }
    };


    console.log("isAuthenticated ;",isAuthenticated)
    console.log("user ;",user)




    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Navigation */}
            <LandingNav
                isAuthenticated={isAuthenticated}
                user={user}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                onLogout={onLogout}
            />

            {/* Hero Section */}
            <section className="pt-24 pb-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="flex items-center space-x-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-medium">
                                <Sparkles className="h-4 w-4" />
                                <span>AI-Powered Data Transformation</span>
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            Transform Chaos Into
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                {" "}Clarity
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                            Our intelligent AI agent converts messy, unstructured data into perfectly formatted,
                            actionable information. Turn documents, emails, and raw text into structured JSON,
                            tables, and organized datasets instantly.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={() => isAuthenticated ? setCurrentView('upload') : setCurrentView('login')}
                                className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                            >
                                <Upload className="h-5 w-5" />
                                <span>{isAuthenticated ? 'Start Processing Data' : 'Get Started Free'}</span>
                                <ArrowRight className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setCurrentView('dashboard')}
                                className=" text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg font-semibold  hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-center space-x-2"
                            >
                                <Activity className="h-5 w-5" />
                                <span>View Dashboard</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>


            {/* Features Section */}
            <section id="features" className="py-20 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Powerful Features</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Everything you need to transform unstructured data into organized, actionable insights
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Brain className="h-8 w-8 text-indigo-600" />,
                                title: "Intelligent Processing",
                                description: "Advanced AI algorithms understand context and extract meaningful information from any type of unstructured data."
                            },
                            {
                                icon: <FileJson className="h-8 w-8 text-green-600" />,
                                title: "Multiple Output Formats",
                                description: "Generate JSON, CSV, XML, or custom formats. Perfect for APIs, databases, and downstream applications."
                            },
                            {
                                icon: <Zap className="h-8 w-8 text-yellow-600" />,
                                title: "Lightning Fast",
                                description: "Process thousands of documents in seconds. Built for enterprise-scale data transformation needs."
                            },
                            {
                                icon: <Shield className="h-8 w-8 text-blue-600" />,
                                title: "Secure & Private",
                                description: "Enterprise-grade security ensures your sensitive data remains protected throughout the entire process."
                            },
                            {
                                icon: <Globe className="h-8 w-8 text-purple-600" />,
                                title: "Multi-Language Support",
                                description: "Process documents and data in over 50 languages with consistent accuracy and formatting."
                            },
                            {
                                icon: <BarChart3 className="h-8 w-8 text-red-600" />,
                                title: "Analytics Dashboard",
                                description: "Track processing metrics, data quality scores, and transformation success rates in real-time."
                            }
                        ].map((feature, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:bg-gray-100 transition-colors duration-200 ">
                                <div className="mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="py-20 px-6 sm:px-12 lg:px-20 bg-white dark:bg-gray-900">
                <div ref={sectionRef} className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Unstructured Input Card */}
                    <motion.div
                        initial={{ opacity: 1, zIndex: 10, scale: 1, y: 0 }}
                        animate={
                            inView
                                ? { opacity: 0.5, scale: 0.9, y: 50, zIndex: 1 }
                                : { opacity: 1, scale: 1, y: 0, zIndex: 10 }
                        }
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="space-y-6"
                    >
                        <Card className=" bg-red-50">
                            <CardHeader>
                                <CardTitle className="text-red-700 flex items-center">
                                    <FileText className="mr-2 h-5 w-5" />
                                    Unstructured Input
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm text-gray-700">
                                    {isPlaying ? (
                                        <div className="animate-pulse">Processing...</div>
                                    ) : (
                                        ` John Smith called yesterday about pricing
                    Email: john@company.com, Phone: 555-0123
                    Interested in enterprise plan, budget ~$50k
                    Meeting scheduled for next Tuesday 2pm
                    Follow up needed on contract terms...`
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Structured Output Card */}
                    <motion.div
                        initial={{ opacity: 0, zIndex: 1, scale: 0.95, y: 50 }}
                        animate={
                            inView
                                ? { opacity: 1, scale: 1.05, y: 0, zIndex: 20 }
                                : { opacity: 0, scale: 0.95, y: 50, zIndex: 1 }
                        }
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="space-y-6"
                    >
                        <Card className=" bg-green-50">
                            <CardHeader>
                                <CardTitle className="text-green-700 flex items-center">
                                    <Code className="mr-2 h-5 w-5" />
                                    Structured Output
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-gray-900 p-4 rounded-lg font-mono text-sm text-green-400 whitespace-pre-wrap">
                                    {isPlaying ? (
                                        <div className="animate-pulse">Generating...</div>
                                    ) : (
                                        JSON.stringify(structuredOutput, null, 2)
                                    )}
                                </pre>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section
                id="how-it-works"
                className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Three simple steps to transform your unstructured data into formatted gold
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "01",
                                icon: <FileText className="h-12 w-12 text-indigo-600" />,
                                title: "Upload Your Data",
                                description: "Drop in documents, paste text, or connect your data sources. We support PDFs, emails, web pages, and more."
                            },
                            {
                                step: "02",
                                icon: <Brain className="h-12 w-12 text-indigo-600" />,
                                title: "AI Processing",
                                description: "Our intelligent agent analyzes structure, extracts entities, and understands relationships in your data."
                            },
                            {
                                step: "03",
                                icon: <Database className="h-12 w-12 text-indigo-600" />,
                                title: "Get Formatted Output",
                                description: "Receive clean, structured data in your preferred format, ready for analysis or integration."
                            }
                        ].map((step, index) => (
                            <div key={index} className="text-center">
                                <div className="bg-white dark:bg-gray-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg dark:shadow-md">
                                    {step.icon}
                                </div>
                                <div className="text-sm font-bold text-indigo-600 mb-2">STEP {step.step}</div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{step.title}</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-xs mx-auto">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Use Cases Section */}
            <section id="use-cases" className="py-20 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Perfect For Every Industry</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            From startups to enterprises, see how teams use DataMind to streamline their workflows
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                title: "Finance",
                                description: "Extract structured data from financial reports, invoices, and transaction records",
                                color: "bg-green-100 text-green-700"
                            },
                            {
                                title: "Healthcare",
                                description: "Process medical records, research papers, and patient documentation",
                                color: "bg-blue-100 text-blue-700"
                            },
                            {
                                title: "Legal",
                                description: "Structure contracts, legal documents, and case files for analysis",
                                color: "bg-purple-100 text-purple-700"
                            },
                            {
                                title: "E-commerce",
                                description: "Organize product descriptions, reviews, and inventory data",
                                color: "bg-orange-100 text-orange-700"
                            },
                            {
                                title: "Research",
                                description: "Transform academic papers and datasets into analyzable formats",
                                color: "bg-indigo-100 dark:bg-indigo-900 text-white"
                            },
                            {
                                title: "Marketing",
                                description: "Structure customer feedback, survey responses, and campaign data",
                                color: "bg-pink-100 text-pink-700"
                            },
                            {
                                title: "HR",
                                description: "Process resumes, employee records, and performance reviews",
                                color: "bg-yellow-100 text-yellow-700"
                            },
                            {
                                title: "Real Estate",
                                description: "Extract data from property listings, contracts, and market reports",
                                color: "bg-teal-100 text-teal-700"
                            }
                        ].map((useCase, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg  hover:shadow-lg transition-shadow duration-200">
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${useCase.color}`}>
                                    {useCase.title}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{useCase.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16  bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: "10M+", label: "Documents Processed" },
                            { number: "99.9%", label: "Accuracy Rate" },
                            { number: "50+", label: "Languages Supported" },
                            { number: "24/7", label: "Processing Uptime" }
                        ].map((stat, index) => (
                            <div key={index}>
                                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                                <div className="text-indigo-200">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Data?
                    </h2>
                    <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
                        Join thousands of teams who trust DataMind to convert their unstructured data
                        into actionable insights. Start processing your data in minutes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => navigate(isAuthenticated ? '/upload' : '/login')}
                            className="bg-white dark:bg-gray-900 text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 dark:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                        >
                            <Upload className="h-5 w-5" />
                            <span>{isAuthenticated ? 'Start Processing' : 'Start Free Trial'}</span>
                            <ArrowRight className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className=" text-white px-8 py-4 rounded-lg font-semibold hover:bg-white dark:bg-gray-900 hover:text-indigo-600 transition-all duration-200 flex items-center space-x-2"
                        >
                            <Activity className="h-5 w-5" />
                            <span>View Dashboard</span>
                        </button>
                    </div>
                </div>
            </section>


            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <Brain className="h-8 w-8 text-indigo-400" />
                                <span className="text-xl font-bold">DataMind</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed">
                                Transforming unstructured data into actionable insights with the power of AI.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Support</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className=" mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 DataMind. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
