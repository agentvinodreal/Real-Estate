import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { setTokenGetter } from '@carry/shared'
import Layout from './components/Layout'
import Home from './pages/Home'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import Construction from './pages/Construction'
import ConstructionDetail from './pages/ConstructionDetail'
import About from './pages/About'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Contact from './pages/Contact'
import LocalityPage from './pages/LocalityPage'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Marketplace from './pages/Marketplace'
import HomeDesigner from './pages/HomeDesigner'
import { CartProvider } from './context/CartContext'

function TokenBridge() {
  const { getToken } = useAuth()
  useEffect(() => {
    setTokenGetter(getToken)
  }, [getToken])
  return null
}

export default function App() {
  return (
    <CartProvider>
      <TokenBridge />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:slug" element={<PropertyDetail />} />
          <Route path="/construction" element={<Construction />} />
          <Route path="/construction/:slug" element={<ConstructionDetail />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/home-designer" element={<HomeDesigner />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/properties/area/:locality" element={<LocalityPage />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>
      </Routes>
    </CartProvider>
  )
}
