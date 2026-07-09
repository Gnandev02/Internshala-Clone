import { selectuser } from "@/Feature/Userslice";
import { ExternalLink, Mail, User } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
interface User {
  name: string;
  email: string;
  photo: string;
}
const initialApplications = [
  {
    _id: "1",
    company: "Tech Corp",
    category: "Software",
    user: { name: "John Doe", email: "john@example.com", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces" },
    createdAt: "2024-03-10T12:00:00Z",
    status: "accepted",
  },
  {
    _id: "2",
    company: "Health Solutions",
    category: "Healthcare",
    user: { name: "Rahul", email: "jane@example.com", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces" },
    createdAt: "2024-03-08T10:30:00Z",
    status: "pending",
  },
  {
    _id: "3",
    company: "EduLearn",
    category: "Education",
    user: { name: "Rahul", email: "alice@example.com", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces" },
    createdAt: "2024-03-05T09:15:00Z",
    status: "rejected",
  },
];

const Index = () => {
  const user = useSelector(selectuser);
  
  const [data, setdata] = useState<any>(initialApplications);
  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/application");
        if (res.data && res.data.length > 0) {
          setdata(res.data);
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchdata();
  }, []);

  const userApplications = data === initialApplications
    ? data.map((app: any) => ({ ...app, user: { ...app.user, name: user?.name || "Guest" } }))
    : data.filter((app: any) => app.user?.name === user?.name);
  const activeCount = userApplications.filter((app: any) => app.status === "pending").length;
  const acceptedCount = userApplications.filter((app: any) => app.status === "accepted").length;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              {user?.photo ? (
                <img
                  src={user?.photo}
                  alt={user?.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-16 pb-8 px-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name || "Guest User"}</h1>
              <div className="mt-2 flex items-center justify-center text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user?.email || "guest@example.com"}</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <span className="text-blue-600 font-semibold text-2xl">
                    {activeCount}
                  </span>
                  <p className="text-blue-600 text-sm mt-1">
                    Active Applications
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <span className="text-green-600 font-semibold text-2xl">
                    {acceptedCount}
                  </span>
                  <p className="text-green-600 text-sm mt-1">
                    Accepted Applications
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center pt-4">
                <Link
                  href="/userapplication"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  View Applications
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
