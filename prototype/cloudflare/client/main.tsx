import { createRoot } from 'react-dom/client';
import CollectorApp from '../../app/collector-app';
import '../../app/globals.css';

createRoot(document.getElementById('root')!).render(<CollectorApp publicDemo />);
