import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Login from './features/auth/pages/Login'
import Layout from './shared/components/Layout'
import FieldOpsLayout from './shared/components/FieldOpsLayout'
import Leads from './features/leads/pages/Leads'
import Orders from './features/marketplace/pages/Orders'
import Properties from './features/properties/pages/Properties'
import PropertyForm from './features/properties/pages/PropertyForm'
import Projects from './features/construction/pages/Projects'
import Blog from './features/blog/pages/Blog'
import Testimonials from './features/testimonials/pages/Testimonials'
import Marketplace from './features/marketplace/pages/Marketplace'
import FieldOpsProperties from './features/fieldops/pages/Properties'
import FieldOpsLabour from './features/fieldops/pages/Labour'
import FieldOpsShops from './features/fieldops/pages/Shops'
import FieldOpsAgents from './features/fieldops/pages/Agents'
import FieldOpsProjects from './features/fieldops/pages/Projects'
import { setTokenGetter } from './shared/lib/adminApi'

/**
 * Registers the live Clerk token getter for adminApi.ts's authFetch. The Field
 * Ops client reads the same getter through getAuthToken(), so this one bridge
 * serves both APIs — one Clerk session, two backends.
 */
function TokenBridge() {
  const { getToken } = useAuth()
  useEffect(() => {
    setTokenGetter(getToken)
  }, [getToken])
  return null
}

/** Strips a /website prefix and re-enters the root-mounted website routes. */
function WebsiteRedirect() {
  const { pathname, search } = useLocation()
  const rest = pathname.replace(/^\/website/, '')
  return <Navigate to={`${rest || '/'}${search}`} replace />
}

export default function App() {
  return (
    <>
      <TokenBridge />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Website workspace. Deliberately left at the root rather than moved
            under /website/*, so existing bookmarks keep resolving. */}
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

        {/* Field Ops workspace — a separate API, database and Cloudinary cloud. */}
        <Route path="/field-ops" element={<FieldOpsLayout />}>
          <Route index element={<Navigate to="/field-ops/properties" replace />} />
          <Route path="properties" element={<FieldOpsProperties />} />
          <Route path="labour" element={<FieldOpsLabour />} />
          <Route path="shops" element={<FieldOpsShops />} />
          <Route path="agents" element={<FieldOpsAgents />} />
          {/* Registered but intentionally absent from the tab list — see the
              note at the top of features/fieldops/pages/Projects.tsx. */}
          <Route path="projects" element={<FieldOpsProjects />} />
        </Route>

        {/* The /website/* spelling resolves too, so either form works. */}
        <Route path="/website/*" element={<WebsiteRedirect />} />
      </Routes>
    </>
  )
}
