import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import Footer from "@/apps/webbis/pages/footer";

import Logo from "../../assets/images/logolight.svg";
import SwapieText from "../../assets/images/swapie.svg";
import SwapieHapie from "../../assets/images/swapiehapie.svg";
import SwapieLightText from "../../assets/images/swapie_text.svg";
import service from "../../assets/images/Service.svg";

function LandingPage() {
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFooterItem, setActiveFooterItem] = useState(null);
  const testimonialsRef = useRef(null);

  const testimonials = [
    {
      id: 1,
      text: "Amazing platform! Found help quickly and the experience was smooth.",
      user: "John Doe",
      role: "Homeowner",
    },
    {
      id: 2,
      text: "Earned enough coins to get my entire house painted! This platform changed how I exchange services.",
      user: "Sarah Wilson",
      role: "Graphic Designer",
    },
    {
      id: 3,
      text: "As a student, I offer tutoring services and get home repairs in return. Perfect system!",
      user: "Mike Chen",
      role: "University Student",
    },
    {
      id: 4,
      text: "The coin system is brilliant. I fixed computers and earned enough for gardening services.",
      user: "Alex Johnson",
      role: "IT Specialist",
    },
    {
      id: 5,
      text: "Community is amazing here. Everyone helps each other without money involved.",
      user: "Maria Garcia",
      role: "Community Manager",
    },
    {
      id: 6,
      text: "Started with small tasks, now I have a network of trusted service providers.",
      user: "David Kim",
      role: "Freelancer",
    },
  ];

  const footerDescriptions = {
    "How it works":
      "Learn how to post services, earn coins, and exchange skills with our community members in three simple steps.",
    "Success Stories":
      "Read inspiring stories from our community members who have transformed their lives through skill exchange.",
    "Community Guidelines":
      "Our community standards ensure a safe and respectful environment for all members to exchange services.",
    "Help Center":
      "Find answers to common questions and get support for any issues you encounter on our platform.",
    "Safety Tips":
      "Important safety guidelines to follow when meeting with other community members for service exchanges.",
    "Contact Us":
      "Get in touch with our support team for any questions or concerns about the platform.",
    "Privacy Policy":
      "Learn how we protect your personal information and ensure your data privacy and security.",
    "Terms & Conditions":
      "Read our terms of service and understand the rules and regulations of using our platform.",
    "Cookie Policy":
      "Information about how we use cookies and similar technologies to enhance your experience.",
  };

  const scrollTestimonials = (direction) => {
    if (testimonialsRef.current) {
      const scrollAmount = 300;
      testimonialsRef.current.scrollLeft += direction * scrollAmount;
    }
  };

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const handleNavigate = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="landing-wrapper">

      <nav className="nav">
        <div className="nav-left">
          <img src={Logo} alt="logo" className="logo" />
          <img src={SwapieText} alt="swapie" className="swapie-text" />
          <div className="nav-tagline">Skill Exchange Community</div>
        </div>

        <div className="nav-right">
          <button
            className="login-btn"
            onClick={() => handleNavigate("/swapie/signin")}
          >
            Login
          </button>
          <button
            className="signup-btn"
            onClick={() => handleNavigate("/webbis/signup")}
          >
            Sign Up
          </button>
        </div>
      </nav>

      <div className="hero">
        
        <div className="hero-art">
            <div className="floating-shape shape-1"></div>
      <div className="floating-shape shape-2"></div>
      <div className="floating-shape shape-3"></div>
      <div className="floating-shape shape-4"></div>
      
      <div className="floating-line line-1"></div>
      <div className="floating-line line-2"></div>
      <div className="floating-line line-3"></div>
      
      <div className="pulsing-orb orb-1"></div>
      <div className="pulsing-orb orb-2"></div>
      <div className="pulsing-orb orb-3"></div>
      
      <div className="orbital-dots">
        <div className="orbital-dot"></div>
        <div className="orbital-dot"></div>
        <div className="orbital-dot"></div>
      </div>
      
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      
      <div className="glow-spot glow-spot-1"></div>
      <div className="glow-spot glow-spot-2"></div>

          <img
            src={SwapieHapie}
            alt="swapie hapie"
            className="swapie-hapie-bg"
          />
          <div className="hero-glow"></div>
        </div>

        <div className="hero-content">
          <p className="subtitle">SERVICE EXCHANGE PLATFORM</p>
          <h1>
            Tasks?
            <br />
            Handled.
          </h1>
          <p className="hero-description">
            Exchange skills, earn coins, and get things done in your community.
            No money needed - just pure talent sharing.
          </p>
          <button
            className="hero-btn"
            onClick={() => handleNavigate("/webbis/signup")}
          >
            Get Started
          </button>
        </div>
      </div>

      <section className="services-section">
        <div className="section-header">
          <h2>Trending Services</h2>
          <p>Most popular services in your area right now</p>
        </div>

        <div className="cards-row">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card">
              <div className="card-badge">
                {n % 2 === 0 ? "New" : "Popular"}
              </div>
              <img src={service} alt="service" className="card-img" />
              <div className="card-body">
                <h3 className="card-title">
                  {
                    [
                      "Tutoring",
                      "Design",
                      "Cleaning",
                      "Repair",
                      "Cooking",
                      "Fitness",
                    ][n - 1]
                  }
                </h3>
                <p className="card-sub">Local • {n} hours ago</p>
                <div className="card-price">
                  {[100, 200, 150, 180, 120, 160][n - 1]} coins
                </div>
                <div className="card-stars">★★★★★</div>
                <button
                  className="card-btn"
                  onClick={() => handleNavigate("/swapie-app/provider")}
                >
                  Book Service
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          className="see-more-btn"
          onClick={() => handleNavigate("/swapie-app/demands")}
        >
          Explore All Services
        </button>
      </section>

      <section className="categories">
        <div className="section-header">
          <h2>Browse by Category</h2>
          <p>Find exactly what you need or offer what you're best at</p>
        </div>

        <div className="cat-row" onClick={() => handleNavigate("/webbis/signup")}>
          {[
            { name: "Design & Creative", icon: "🎨" },
            { name: "Home Services", icon: "🏠" },
            { name: "Cleaning", icon: "✨" },
            { name: "Tutoring", icon: "📚" },
            { name: "Tech Support", icon: "💻" },
            { name: "Health & Fitness", icon: "💪" },
            { name: "Events", icon: "🎉" },
            { name: "Other Skills", icon: "🔧" },
          ].map((cat) => (
            <div key={cat.name} className="cat-bubble">
              <span className="cat-icon">{cat.icon}</span>
              {cat.name}
            </div>
          ))}
        </div>
      </section>

      <section className="testimonials">
        <div className="section-header">
          <h2 className="comments-title">What Our Community Says</h2>
          <p>
            Real stories from people who transformed how they exchange services
          </p>
        </div>

        <div className="testimonials-container">
          <button
            className="scroll-btn left"
            onClick={() => scrollTestimonials(-1)}
          >
            ‹
          </button>

          <div className="testimonials-scroll" ref={testimonialsRef}>
            <div className="testimonials-track">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="test-card">
                  <div className="test-avatar">
                    {testimonial.user.charAt(0)}
                  </div>
                  <p className="test-stars">★★★★★</p>
                  <p className="test-text">"{testimonial.text}"</p>
                  <div className="test-user-info">
                    <p className="test-user">{testimonial.user}</p>
                    <p className="test-role">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="scroll-btn right"
            onClick={() => scrollTestimonials(1)}
          >
            ›
          </button>
        </div>

        <div className="mobile-testimonials">
          <div className="test-card active">
            <div className="test-avatar">
              {testimonials[activeTestimonial].user.charAt(0)}
            </div>
            <p className="test-stars">★★★★★</p>
            <p className="test-text">
              "{testimonials[activeTestimonial].text}"
            </p>
            <div className="test-user-info">
              <p className="test-user">
                {testimonials[activeTestimonial].user}
              </p>
              <p className="test-role">
                {testimonials[activeTestimonial].role}
              </p>
            </div>
          </div>
          <div className="carousel-controls">
            <button className="carousel-btn" onClick={prevTestimonial}>
              ‹
            </button>
            <div className="carousel-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${
                    index === activeTestimonial ? "active" : ""
                  }`}
                  onClick={() => setActiveTestimonial(index)}
                />
              ))}
            </div>
            <button className="carousel-btn" onClick={nextTestimonial}>
              ›
            </button>
          </div>
        </div>
      </section>

      <section className="how-join-split">
        <div className="how-it-works">
          <h2>How Does It Work?</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <p>
                Share your skills with others by posting a service you can
                provide.
              </p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <p>
                Every time someone uses your service, you earn coins instead of
                money.
              </p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <p>
                Use your coins to get services from others from tutoring to
                design and more.
              </p>
            </div>
          </div>
        </div>

        <div className="ready-to-join">
          <h2>Ready to join, share, and benefit together?</h2>
          <button
            className="get-started-btn"
            onClick={() => handleNavigate("/webbis/signup")}
          >
            Get started
          </button>
        </div>
      </section>
      <footer>
        <div>
          <Footer />
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
