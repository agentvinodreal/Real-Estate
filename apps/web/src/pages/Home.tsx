import Seo from '../components/Seo'
import Hero from '../sections/Hero'
import Services from '../sections/Services'
import FeaturedListings from '../sections/FeaturedListings'
import Stats from '../sections/Stats'
import Process from '../sections/Process'
import Testimonials from '../sections/Testimonials'
import CTA from '../sections/CTA'

export default function Home() {
  return (
    <>
      <Seo path="/" />
      <Hero />
      <Services />
      <FeaturedListings />
      <Stats />
      <Process />
      <Testimonials />
      <CTA />
    </>
  )
}
