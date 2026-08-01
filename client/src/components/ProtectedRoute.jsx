import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute, homeRouteFor } from '../lib/access';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  // Restricted roles (e.g. leads_agent) get bounced to their own home rather
  // than seeing a module they can't use. The API blocks them regardless — this
  // just avoids rendering a page that would only fill with 403s.
  if (!canAccessRoute(user.role, pathname)) {
    return <Navigate to={homeRouteFor(user.role)} replace />;
  }

  return children;
}
