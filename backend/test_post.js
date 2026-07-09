const formData = {
  title: "Test Job",
  company: "Test Company",
  location: "Test Location",
  category: "Test Category",
  aboutCompany: "Test about",
  aboutJob: "Test job desc",
  whoCanApply: "Anyone",
  perks: "Free coffee",
  numberOfOpening: "2",
  CTC: "10 LPA",
  startDate: "2025-01-01",
  AdditionalInfo: "None"
};

fetch("http://localhost:5000/api/job", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData)
})
  .then(res => res.json())
  .then(data => console.log("SUCCESS:", data))
  .catch(err => console.error("ERROR:", err));
