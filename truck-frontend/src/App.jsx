import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import TripPlanner from './pages/TripPlanner';
import Layout from './components/Layout';

window.BaseUrl = import.meta.env.VITE_API_URL;

export default function App() {
  return (
    <Layout>
      <TripPlanner />
    </Layout>
  );
}
