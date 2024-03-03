import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { useState } from 'react';
import Footer from './Components/Footer';
import NavBar from './Components/NavBar';
import AddClients from './Pages/AddClients';
import AddOneClient from './Pages/AddOneClient';
import ChangePassword from './Pages/ChangePassword';
import Clients from './Pages/Clients';
import Dashboard from './Pages/Dashboard';
import E404 from './Pages/E404';
import Settings from './Pages/Settings';

function App({ credentials, renderLogin }: { credentials: Credentials; renderLogin: () => void }) {
	const [Credentials, setCredentials] = useState(credentials);

	const routes = [
		{
			path: '/',
			element: <Dashboard />
		},
		{
			path: '/Clients',
			element: <Clients credentials={Credentials} />
		},
		{
			path: '/Clients/AddOne',
			element: <AddOneClient credentials={Credentials} />
		},
		{
			path: '/Clients/Add',
			element: <AddClients credentials={Credentials} />
		},
		{
			path: '/Settings',
			element: <Settings renderLogin={renderLogin} />
		},
		{
			path: '/Settings/ChangePassword',
			element: <ChangePassword setCredentials={setCredentials} credentials={Credentials} />
		},
		{
			path: '/*',
			element: <E404 />
		}
	];

	return (
		<BrowserRouter>
			<div className="Main">
				<NavBar />
				<div className="App">
					<Routes>
						{routes.map((element, i) => {
							return <Route path={element.path} element={element.element} key={i} />;
						})}
					</Routes>
					<Footer />
				</div>
			</div>
		</BrowserRouter>
	);
}

export default App;
