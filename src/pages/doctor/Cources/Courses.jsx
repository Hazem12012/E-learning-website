import React, { useState } from "react";
import "./Courses.css";

import cover1 from "../../../images/porfolio.png";
import cover2 from "../../../images/porfolio.png";
import cover3 from "../../../images/porfolio.png";
import cover4 from "../../../images/porfolio.png";
import cover5 from "../../../images/porfolio.png";
import cover6 from "../../../images/porfolio.png";
import cover7 from "../../../images/porfolio.png";
import cover8 from "../../../images/porfolio.png";

const initialCourses = [
  {
    id: 1,
    code: "MA112",
    title: "Discrete Math",
    instructor: "Dr. Mostafa",
    students: 45678,
    enrollment: 842,
    image: cover1,
    category: "Math",
    description: "Master Discrete Math from basics to advanced concepts",
  },
  {
    id: 2,
    code: "IT222",
    title: "Computer Networks",
    instructor: "Dr. Khaled",
    students: 98234,
    enrollment: 1150,
    image: cover2,
    category: "Networking",
    description: "Learn networks from scratch with real-world projects",
  },
  {
    id: 3,
    code: "IT301",
    title: "Computer Security",
    instructor: "Dr. Salma",
    students: 34567,
    enrollment: 763,
    image: cover3,
    category: "cybersecurity",
    description: "Learn how to secure your websites and applications",
  },
  {
    id: 4,
    code: "CS102",
    title: "Introduction Web Development",
    instructor: "Dr. Osama",
    students: 23456,
    enrollment: 920,
    image: cover4,
    category: "Web Development",
    description: "Learn design principles and website building",
  },
  {
    id: 5,
    code: "IS202",
    title: "Data Science",
    instructor: "Dr. Mariam",
    students: 56789,
    enrollment: 1050,
    image: cover5,
    category: "Data Science",
    description:
      "Master Python, NumPy, Pandas, Matplotlib, and machine learning basics",
  },
  {
    id: 6,
    code: "MA103",
    title: "Linear Algebra",
    instructor: "Dr. Ahmed",
    students: 41234,
    enrollment: 678,
    image: cover6,
    category: "Math",
    description: "Master Linear Algebra from basics",
  },
  {
    id: 7,
    code: "AI204",
    title: "Artificial Intelligence",
    instructor: "Dr. Mayar",
    students: 38901,
    enrollment: 1123,
    image: cover7,
    category: "Data Science",
    description: "Introduction to AI concepts and applications",
  },
  {
    id: 8,
    code: "AI330",
    title: "Machine Learning",
    instructor: "Dr. Anna",
    students: 87654,
    enrollment: 599,
    image: cover8,
    category: "Data Science",
    description:
      "Complete ML course covering supervised and unsupervised learning algorithms",
  },
];

export default function Courses() {
  const [courses] = useState(initialCourses);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    "All",
    "Web Development",
    "Math",
    "Networking",
    "Data Science",
    "cybersecurity",
  ];

  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === "All" || course.category === selectedCategory;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      course.title.toLowerCase().includes(q) ||
      course.instructor.toLowerCase().includes(q) ||
      course.description.toLowerCase().includes(q) ||
      (course.code && course.code.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className='courses-page'>
      <div className='hero-section'>
        <div className='hero-content'>
          <h1>Learn Without Limits</h1>
          <p>
            Start, switch, or advance your career with university-level courses
            taught by our faculty
          </p>
          <div className='search-bar'>
            <input
              type='text'
              placeholder='Search for courses or codes (e.g. MA112)...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className='search-btn' aria-label='Search'>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z'
                  stroke='white'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className='container course_container'>
        <div className='category-filter'>
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${
                selectedCategory === category ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category)}>
              {category}
            </button>
          ))}
        </div>

        <div className='results-header'>
          <h2>{selectedCategory} Courses</h2>
          <p>
            {filteredCourses.length}{" "}
            {filteredCourses.length === 1 ? "course" : "courses"}
          </p>
        </div>

        <div className='courses-grid'>
          {filteredCourses.map((course) => (
            <div key={course.id} className='course-card'>
              <div className='course-image'>
                <img src={course.image} alt={course.title} />
              </div>

              <div className='course-content'>
                <div className='title-row'>
                  <h3>{course.title}</h3>
                  <span className='course-code'>{course.code}</span>
                </div>

                <p className='course-description'>{course.description}</p>
                <p className='instructor'>Instructor: {course.instructor}</p>

                <div className='course-meta'>
                  <span className='enrollment'>
                    Enrollment: {course.enrollment.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className='no-results'>
            <h3>No courses found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
