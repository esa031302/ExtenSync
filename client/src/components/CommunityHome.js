import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './CommunityHome.css';

const CommunityHome = () => {
  const features = [];

  const stats = [
    { number: '50+', label: 'Active Programs' },
    { number: '25+', label: 'Partner Organizations' },
    { number: '95%', label: 'Satisfaction Rate' }
  ];

  return (
    <div className="community-home">

      {/* Our Key Areas of Focus Section */}
      <section className="focus-section py-5">
        <Container>
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="focus-title">Our Key Areas of Focus</h2>
          </div>
          
          <div className="focus-grid">
            <div className="focus-card" data-aos="fade-right">
              <div className="focus-image">
                <img 
                  src="/gad.jpg" 
                  alt="Gender and Development Discussion"
                  className="img-fluid"
                />
              </div>
              <div className="focus-content">
                <h3 className="focus-card-title">Gender and Development</h3>
                <p className="focus-description">
                  BatStateU is committed to being a leading gender-responsive higher education institution. 
                  Find out how the University supports and promotes Gender and Development.
                </p>
              </div>
            </div>
            
            <div className="focus-card" data-aos="fade-left">
              <div className="focus-image">
                <img 
                  src="/modern-university-building-with-red-accents-repres.jpg" 
                  alt="University Linkages"
                  className="img-fluid"
                />
              </div>
              <div className="focus-content">
                <h3 className="focus-card-title">Linkages</h3>
                <p className="focus-description">
                  Browse the list of partners and linkages for extension projects and activities of BatStateU. 
                  The database presents completed and active projects of the University.
                </p>
              </div>
            </div>
            
            <div className="focus-card" data-aos="fade-right">
              <div className="focus-image">
                <img 
                  src="/community-activity.jpg" 
                  alt="Programs and Activities"
                  className="img-fluid"
                />
              </div>
              <div className="focus-content">
                <h3 className="focus-card-title">Programs, Projects and Activities</h3>
                <p className="focus-description">
                  From Outreach services to Capability Building Training Programs, browse our completed and 
                  ongoing program, projects, and activities for the communities.
                </p>
              </div>
            </div>
            
            <div className="focus-card" data-aos="fade-left">
              <div className="focus-image">
                <img 
                  src="/sdg.jpg" 
                  alt="Sustainable Development Goals"
                  className="img-fluid"
                />
              </div>
              <div className="focus-content">
                <h3 className="focus-card-title">Sustainable Development Goals</h3>
                <p className="focus-description">
                  BatStateU supports the 17 Sustainable Development Goals of the United Nations and ensures 
                  these are addressed in its extension activities. Browse the university's initiatives aligned with SDGs.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

    </div>
  );
};

export default CommunityHome;
