import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { setTokenGetter } from '@carry/shared'
import Layout from './shared/components/Layout'
import Home from './features/home/pages/Home'
import Properties from './features/properties/pages/Properties'
import PropertyDetail from './features/properties/pages/PropertyDetail'
import Construction from './features/construction/pages/Construction'
import ConstructionDetail from './features/construction/pages/ConstructionDetail'
import About from './features/about/pages/About'
import Blog from './features/blog/pages/Blog'
import BlogPost from './features/blog/pages/BlogPost'
import Contact from './features/contact/pages/Contact'
import LocalityPage from './features/properties/pages/LocalityPage'
import Privacy from './features/legal/pages/Privacy'
import Terms from './features/legal/pages/Terms'
import Marketplace from './features/marketplace/pages/Marketplace'
import HomeDesigner from './features/home-designer/pages/HomeDesigner'
import { CartProvider } from './features/marketplace/context/CartContext'

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
