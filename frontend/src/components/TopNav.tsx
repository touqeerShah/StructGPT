import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    BarChart3,
    Activity,
    Share2,
    Settings as SettingsIcon,
    User,
    LogOut,
    ArrowLeft,
    ArrowDown,
    RefreshCw,
    Download,
    CheckCircle,
    Save
} from "lucide-react";

interface TopNavProps {
    user?: { email: string; name: string } | null;
    isAuthenticated: boolean;
    pageTitle: string;
    subTitle: string;
    setShowMetadata?: any;
    showMetadata?: boolean;
    page?: string;
    onLogout: () => void;
    onBack?: string;
    resultShare?: any;
    onSave?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({
    user,
    isAuthenticated,
    pageTitle = "Share & Collaborate",
    subTitle = "",
    setShowMetadata,
    showMetadata,
    page,
    onBack,
    onLogout,
    resultShare,
    onSave
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    // console.log("onBack ", onBack)
    return (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4 py-4 sm:flex-nowrap">
                    {/* Left: Back + Logo + Page Info */}
                    <div className="flex items-center space-x-4">
                        {page !== "share" && (

                            <button
                                onClick={() => navigate(onBack || "/")}
                                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back</span>
                            </button>
                        )}

                        {page === "share" && (
                            <button
                                onClick={() => navigate(onBack || "/", {
                                    state: {
                                        jobType: resultShare?.jobType,
                                        jobId: resultShare?.fileId,
                                        user: user,
                                        isAuthenticated: isAuthenticated,
                                        pageTitle: resultShare.fileName,
                                        subTitle: "Processing Job • ID: " + resultShare.fileId,
                                        page: "results",
                                        onBack: `/dashboard/`,
                                    }
                                })}
                                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back</span>
                            </button>
                        )}
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                        <div className="truncate">
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                                {pageTitle}
                            </h1>
                            {subTitle && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {subTitle}
                                </p>
                            )}
                        </div>

                        {page === "dashboard" && (
                            <div className="flex items-center space-x-2">
                                <div
                                    className={`h-2 w-2 rounded-full ${showMetadata ? "bg-green-500" : "bg-gray-400"
                                        }`}
                                />
                                <span className="text-sm text-white">
                                    {showMetadata ? "Live" : "Paused"}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions (Analytics, Share, Menu) */}
                    <div className="flex items-center space-x-4">
                        {page === "result" && (
                            <>
                                <button
                                    onClick={() => setShowMetadata(!showMetadata)}
                                    className="flex items-center space-x-2 px-3 py-2 text-white hover:text-white transition-colors"
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    <span>Analytics</span>
                                </button>
                                <button
                                    onClick={() => navigate("/share")}
                                    className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <Share2 className="h-4 w-4" />
                                    <span>Share</span>
                                </button>
                            </>
                        )}
                        {page === "dashboard" && (
                            <>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setShowMetadata(!showMetadata)}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${showMetadata
                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        <RefreshCw
                                            className={`h-4 w-4 ${showMetadata ? "animate-spin" : ""
                                                }`}
                                        />
                                        <span>
                                            {showMetadata ? "Auto Refresh" : "Refresh Paused"}
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}
                        {page === "results" && (
                            <>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => navigate(`/share/${resultShare.fileId}`, {
                                            state: {
                                                fileName: resultShare?.fileName,
                                                fileId: resultShare?.fileId,
                                                user: user,
                                                isAuthenticated: isAuthenticated,
                                                pageTitle: resultShare.fileName,
                                                subTitle: "Processing Job • ID: " + resultShare.fileId,
                                                page: "results",
                                                onBack: `/dashboard/details/` + resultShare.fileId,
                                            }
                                        })}
                                        className="flex items-center space-x-2 px-3 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        <span>Share</span>
                                    </button>
                                    <button
                                        onClick={() => setShowMetadata(true)}
                                        className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span>Export</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {page === "settings" && (
                            <>
                                <div className="flex items-center space-x-3">
                                    {showMetadata && (
                                        <div className="flex items-center space-x-2 text-green-600">
                                            <CheckCircle className="h-4 w-4" />
                                            <span className="text-sm">Settings saved</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={onSave}
                                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <Save className="h-4 w-4" />
                                        <span>Save Changes</span>
                                    </button>
                                </div>
                            </>
                        )}


                        {isAuthenticated && (
                            <div className="relative">
                                <button
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <User className="h-4 w-4" />
                                    <span>{user?.name || "User"}</span>
                                    <ArrowDown className="h-4 w-4" />
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden transition-all">
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            <div className="py-2">
                                                {['dashboard', 'upload', 'settings'].map((route) => (
                                                    <button
                                                        key={route}
                                                        onClick={() => {
                                                            navigate(`/${route}`);
                                                            //   setDropdownOpen(false);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 w-full text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        <span className="capitalize">{route}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="py-2">
                                                <button
                                                    onClick={() => {
                                                        onLogout();
                                                        // setDropdownOpen(false);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 w-full text-sm text-gray-700 dark:text-indigo-400 hover:text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-colors"
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TopNav;
