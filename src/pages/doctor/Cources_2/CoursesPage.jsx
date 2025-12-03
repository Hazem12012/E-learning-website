import React, { useState, useEffect } from "react";
import "./CoursesPage.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/SupabaseClient";
import { UserAuth } from "../../services/AuthContext";
import toast from "react-hot-toast";
import cover1 from "./assets/discretemath.jpg"; // Default image

const initialCategories = [
    "Web Development",
    "Math",
    "Networking",
    "Data Science",
    "cybersecurity",
];

export default function CoursesPage() {
    const { session } = UserAuth();
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState(initialCategories);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        code: "",
        title: "",
        instructor: "",
        category: "",
        description: "",
        enrollment: "",
        imageFile: null,
    });

    // Fetch courses from Supabase
    useEffect(() => {
        fetchCourses();
        fetchCategories();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCourses(data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('category');

            if (error) throw error;

            // Get unique categories
            const uniqueCategories = [...new Set(data.map(c => c.category))];
            const allCategories = [...new Set([...initialCategories, ...uniqueCategories])];
            setCategories(allCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const capitalizeWords = (str) => {
        if (!str) return "";
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const filteredCourses = courses.filter((course) => {
        const matchesCategory =
            selectedCategory === "All" || course.category === selectedCategory;
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !q ||
            course.title.toLowerCase().includes(q) ||
            course.instructor.toLowerCase().includes(q) ||
            course.description?.toLowerCase().includes(q) ||
            (course.code && course.code.toLowerCase().includes(q));
        return matchesCategory && matchesSearch;
    });

    const uploadCourseImage = async (file) => {
        if (!file) return null;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${ session.user.id }-${ Date.now() }.${ fileExt }`;
            const filePath = `course-images/${ fileName }`;

            const { error: uploadError } = await supabase.storage
                .from('course-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('course-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
            return null;
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        setForm((f) => ({ ...f, imageFile: file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.code || !form.title || !form.instructor) {
            toast.error("Please fill in course code, title and instructor.");
            return;
        }

        // Check if user is authenticated
        if (!session?.user?.id) {
            toast.error("You must be logged in to create a course");
            return;
        }

        setLoading(true);
        try {
            let imageUrl = cover1;

            // Upload image if provided
            if (form.imageFile) {
                const uploadedUrl = await uploadCourseImage(form.imageFile);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            let enrollment = parseInt(form.enrollment, 10);
            if (!Number.isFinite(enrollment) || enrollment <= 0) {
                enrollment = Math.floor(500 + Math.random() * (1200 - 500 + 1));
            }

            const courseCategory = form.category || "Uncategorized";

            const newCourse = {
                code: form.code.toUpperCase(),
                title: capitalizeWords(form.title),
                instructor: capitalizeWords(form.instructor),
                students: 0,
                enrollment,
                image: imageUrl,
                category: courseCategory,
                description: form.description ?
                    form.description.charAt(0).toUpperCase() + form.description.slice(1) : "",
                created_by: session.user.id, // This links the course to the user
            };

            const { data, error } = await supabase
                .from('courses')
                .insert([newCourse])
                .select()
                .single();

            if (error) throw error;

            // Update categories if new category added
            if (courseCategory && !categories.includes(courseCategory)) {
                setCategories((prev) => [...prev, courseCategory]);
            }

            // Add to local state
            setCourses((prev) => [data, ...prev]);

            toast.success('Course created successfully!');
            closeModal();
        } catch (error) {
            console.error('Error creating course:', error);

            if (error.code === '23505') {
                toast.error('Course code already exists');
            } else {
                toast.error(error.message || 'Failed to create course');
            }
        } finally {
            setLoading(false);
        }
    };


    const closeModal = () => {
        setShowModal(false);
        setForm({
            code: "",
            title: "",
            instructor: "",
            category: "",
            description: "",
            enrollment: "",
            imageFile: null,
        });
    };

    const handleViewDetails = (courseId) => {
        navigate(`/cources/${ courseId }`);
    };

    // const handleDeleteCourse = async (courseId, courseTitle) => {
    //     if (!window.confirm(`Are you sure you want to delete "${ courseTitle }"?`)) {
    //         return;
    //     }

    //     try {
    //         const { error } = await supabase
    //             .from('courses')
    //             .delete()
    //             .eq('id', courseId);

    //         if (error) throw error;

    //         setCourses((prev) => prev.filter((course) => course.id !== courseId));
    //         toast.success('Course deleted successfully');
    //     } catch (error) {
    //         console.error('Error deleting course:', error);
    //         toast.error('Failed to delete course');
    //     }
    // };

    const handleDeleteCourse = async (courseId, courseTitle) => {
        // if (!window.confirm(`Are you sure you want to delete "${ courseTitle }"?`)) {
        //     return;
        // }

        try {
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId)
                .eq('created_by', session.user.id); // Only delete if user owns the course

            if (error) {
                if (error.code === '42501') {
                    toast.error('You can only delete your own courses');
                    return;
                }
                throw error;
            }

            setCourses((prev) => prev.filter((course) => course.id !== courseId));
            toast.success('Course deleted successfully');
        } catch (error) {
            console.error('Error deleting course:', error);
            toast.error('Failed to delete course');
        }
    };

    if (loading && courses.length === 0) {
        return (
            <div className="courses-page">
                <div className="loading-container" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px'
                }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

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
                            placeholder='Search for courses, codes or doctors'
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
                <div className='category-filter d-flex align-items-center justify-content-center'>
                    <button
                        className={`category-btn ${ selectedCategory === "All" ? "active" : "" }`}
                        onClick={() => setSelectedCategory("All")}>
                        All
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={`category-btn ${ selectedCategory === category ? "active" : "" }`}
                            onClick={() => setSelectedCategory(category)}>
                            {category}
                        </button>
                    ))}
                </div>

                <div className='add-course-btn-container'>
                    <button className='add-course-btn' onClick={() => setShowModal(true)}>
                        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' style={{ marginRight: '8px' }}>
                            <path d='M12 5V19M5 12H19' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                        </svg>
                        Add New Course
                    </button>
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
                                <button
                                    className='delete-course-btn'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCourse(course.id, course.title);
                                    }}
                                    aria-label='Delete course'
                                    title='Delete course'
                                >
                                    <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
                                        <path d='M3 6H5H21' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                                        <path d='M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                                    </svg>
                                </button>
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

                                <button
                                    className='view-details-btn'
                                    onClick={() => handleViewDetails(course.id)}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredCourses.length === 0 && !loading && (
                    <div className='no-results'>
                        <h3>No courses found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className='modal-overlay' onClick={closeModal}>
                    <div className='modal-content' onClick={(e) => e.stopPropagation()}>
                        <div className='modal-header'>
                            <h2>Add New Course</h2>
                            <button className='modal-close' onClick={closeModal}>
                                <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                                    <path d='M18 6L6 18M6 6L18 18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className='modal-form'>
                            <div className='form-row'>
                                <div className='form-group-part'>
                                    <label htmlFor='code'>Course Code *</label>
                                    <input
                                        id='code'
                                        name='code'
                                        value={form.code}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className='form-group-part'>
                                    <label htmlFor='title'>Course Title *</label>
                                    <input
                                        id='title'
                                        name='title'
                                        value={form.title}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className='form-row'>
                                <div className='form-group-part'>
                                    <label htmlFor='instructor'>Instructor Name *</label>
                                    <input
                                        id='instructor'
                                        name='instructor'
                                        value={form.instructor}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className='form-group-part'>
                                    <label htmlFor='category'>Category</label>
                                    <input
                                        id='category'
                                        name='category'
                                        value={form.category}
                                        onChange={handleInputChange}
                                        list='category-suggestions'
                                    />
                                    <datalist id='category-suggestions'>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div className='form-row'>
                                <div className='form-group-part'>
                                    <label htmlFor='enrollment'>Enrollment</label>
                                    <input
                                        id='enrollment'
                                        name='enrollment'
                                        type='number'
                                        value={form.enrollment}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className='form-group-part'>
                                    <label htmlFor='imageFile'>Course Image</label>
                                    <input
                                        id='imageFile'
                                        type='file'
                                        accept='image/*'
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            <div className='form-group-part'>
                                <label htmlFor='description'>Description</label>
                                <textarea
                                    id='description'
                                    name='description'
                                    value={form.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                />
                            </div>

                            <div className='modal-actions'>
                                <button type='button' className='btn-cancel' onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type='submit' className='btn-submit' disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}