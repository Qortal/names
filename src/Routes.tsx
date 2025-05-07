import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Layout from './styles/Layout';
import { Market } from './pages/Market';
import { useHandleNameData } from './hooks/useHandleNameData';

// Use a custom type if you need it
interface CustomWindow extends Window {
  _qdnBase: string;
}
const customWindow = window as unknown as CustomWindow;
const baseUrl = customWindow?._qdnBase || '';

export function Routes() {
  useHandleNameData();

  const router = createBrowserRouter(
    [
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            index: true,
            element: <App />,
          },
          {
            path: 'market',
            element: <Market />,
          },
        ],
      },
    ],
    {
      basename: baseUrl,
    }
  );

  return <RouterProvider router={router} />;
}
