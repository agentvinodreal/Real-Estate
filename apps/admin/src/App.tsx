import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Login from './features/auth/pages/Login'
import Layout from './shared/components/Layout'
import Leads from './features/leads/pages/Leads'
import Orders from './features/marketplace/pages/Orders'
import Properties from './features/properties/pages/Properties'
import PropertyForm from './features/properties/pages/PropertyForm'
import Projects from './features/construction/pages/Projects'
import Blog from './features/blog/pages/Blog'
import Testimonials from './features/testimonials/pages/Testimonials'
import Marketplace from './features/marketplace/pages/Marketplace'
import { setTokenGetter } from './shared/lib/adminApi'

/** Registers the live Clerk token getter for adminApi.ts's authFetch. */
function TokenBridge() {
  const { getToken } = useAuth()
  useEffect(() => {
    setTokenGetter(getToken)
  }, [getToken])
  return null
}

export default function App() {
  return (
    <>
      <TokenBridge />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Leads />} />
          <Route path="orders" element={<Orders />} />
          <Route path="properties" element={<Properties />} />
          <Route path="properties/new" element={<PropertyForm />} />
          <Route path="properties/:slug" element={<PropertyForm />} />
          <Route path="projects" element={<Projects />} />
          <Route path="blog" element={<Blog />} />
          <Route path="testimonials" element={<Testimonials />} />
          <Route path="marketplace" element={<Marketplace />} />
        </Route>
      </Routes>
    </>
  )
}
