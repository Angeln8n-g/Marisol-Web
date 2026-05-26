import React from 'react'
import { Navbar, HeroSection, ServicesSection, AboutSection, BeforeAfterSlider, AppointmentForm, Footer, WhatsAppButton } from '../../components/public'

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <BeforeAfterSlider />
      <AppointmentForm />
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
