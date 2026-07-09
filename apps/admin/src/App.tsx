import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Login from './pages/Login'
import Layout from './components/Layout'
import Leads from './pages/Leads'
import Properties from './pages/Properties'
import PropertyForm from './pages/PropertyForm'
import Projects from './pages/Projects'
import Materials from './pages/Materials'
import { setTokenGetter } from './lib/adminApi'

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
          <Route path="properties" element={<Properties />} />
          <Route path="properties/new" element={<PropertyForm />} />
          <Route path="properties/:slug" element={<PropertyForm />} />
          <Route path="projects" element={<Projects />} />
          <Route path="materials" element={<Materials />} />
        </Route>
      </Routes>
    </>
  )
}
