import { Routes, Route } from 'react-router-dom'
import { HomePage } from '../pages/public'

export const PublicRoutes = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
  </Routes>
)
