import axios from "axios";
import { Building2, Calendar, FileText, Loader2, User } from "lucide-react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const initialApplications = [
  {
    _id: "1",
    company: "Tech Corp",
    category: "Software",
    user: { name: "John Doe", email: "john@example.com", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces" },
    createdAt: "2024-03-10T12:00:00Z",
    status: "accepted",
    coverLetter: "I have 5 years of experience building modern web apps with React. I am highly motivated and quick to learn."
  },
  {
    _id: "2",
    company: "Health Solutions",
    category: "Healthcare",
    user: { name: "Jane Smith", email: "jane@example.com", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces" },
    createdAt: "2024-03-08T10:30:00Z",
    status: "pending",
    coverLetter: "I am a dedicated healthcare software engineer focusing on compliance and secure data pipelines."
  },
  {
    _id: "3",
    company: "EduLearn",
    category: "Education",
    user: { name: "Alice Johnson", email: "alice@example.com", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces" },
    createdAt: "2024-03-05T09:15:00Z",
    status: "rejected",
    coverLetter: "My background in education technology aligns perfectly with EduLearn's core mission."
  },
];

const Index = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setloading] = useState(false);
  const [data, setdata] = useState<any>(null);
  
  useEffect(() => {
    if (id) {
      const foundApp = initialApplications.find(app => app._id === id);
      if (foundApp) {
        setdata(foundApp);
      }

      const fetchdata = async () => {
        try {
          if (!foundApp) setloading(true);
          const res = await axios.get(
            `http://localhost:5000/api/application/${id}`
          );
          if (res.data && Object.keys(res.data).length > 0) {
            setdata(res.data);
          }
        } catch (error) {
          console.log(error);
        } finally {
          setloading(false);
        }
      };
      fetchdata();
    }
  }, [id]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">
          Loading application details...
        </span>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <section key={data._id} className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="relative">
              <img
                alt="Applicant photo"
                className="w-full h-full object-cover"
                src={data?.user?.photo}
              />
              {data.status && (
                <div
                  className={`absolute top-4 right-4 px-4 py-2 rounded-full ${
                    data.status === "accepted"
                      ? "bg-green-100 text-green-600"
                      : data.status === "rejected"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  <span className="font-semibold capitalize">
                    {data.status}
                  </span>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-8">
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-sm font-medium text-gray-500">Company</h2>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {data.company}
                </h1>
              </div>

              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-sm font-medium text-gray-500">
                    Cover Letter
                  </h2>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {data.coverLetter}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-500">
                      Application Date
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {new Date(data.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-500">
                      Applied By
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {data.user?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
