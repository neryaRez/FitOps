import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function PageNotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="max-w-md w-full rounded-2xl border bg-white p-8 shadow-sm text-center">
        <h1 className="text-4xl font-bold mb-3">404</h1>

        <p className="text-gray-600 mb-6">
          The page you are looking for does not exist.
        </p>

        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-2.5 text-white font-medium"
        >
          {isAuthenticated ? 'Back to dashboard' : 'Back to home'}
        </Link>
      </div>
    </div>
  );
}
