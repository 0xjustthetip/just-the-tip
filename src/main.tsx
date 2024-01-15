import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { MetaMaskProvider } from '@metamask/sdk-react';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <MetaMaskProvider debug={false} sdkOptions={{
        dappMetadata: {
        name: "Just The Tip",
        url: window.location.host,
        }
    }}>
        <App />
    </MetaMaskProvider>
)
