import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Layout({ children }) {
	const navigate = useNavigate();

	const handleLogout = () => {
		localStorage.removeItem("authToken");
		toast.info("Logged out");
		navigate("/");
	};

	return (
		<div className="min-h-screen flex bg-gray-50">
			{/* Sidebar */}
			<aside className="w-64 bg-white border-r hidden md:block">
				<div className="p-6 border-b">
					<h2 className="text-xl font-semibold">DailyVault</h2>
				</div>
				<nav className="p-4 space-y-2">
					<Link to="/app/dashboard" className="block px-3 py-2 rounded hover:bg-indigo-50">Dashboard</Link>
					<Link to="/app/tasks" className="block px-3 py-2 rounded hover:bg-indigo-50">Tasks</Link>
					<Link to="/app/diary" className="block px-3 py-2 rounded hover:bg-indigo-50">Diary</Link>
				</nav>
				<div className="p-4 border-t">
					<button onClick={handleLogout} className="w-full rounded bg-red-500 text-white px-3 py-2">Logout</button>
				</div>
			</aside>

			{/* Main area */}
			<div className="flex-1 flex flex-col">
				<header className="w-full bg-white border-b p-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							className="md:hidden px-2 py-1 border rounded"
							onClick={() => toast.info("Open sidebar on mobile")}
						>
							Menu
						</button>
						<h1 className="text-lg font-semibold">DailyVault</h1>
					</div>
					<div className="text-sm text-gray-600">Secure client-side encryption</div>
				</header>

				<main className="p-6 overflow-auto">{children}</main>
			</div>
		</div>
	);
}