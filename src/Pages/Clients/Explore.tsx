import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';

import Button from '../../Components/Button';
import { cleanNumber, cleanSatisfaction } from '../../Utils/Cleaners';
import { getCallDuration } from '../../Utils/Utils';
import E404 from '../E404';

function Client({ clients }: { clients: Array<SearchClient> | null }) {
	if (clients == null) return <></>;
	if (clients.length == 0) return <div>Aucun résultat</div>;

	return (
		<div className="ExploreList">
			{clients.map((value, i) => {
				return (
					<Link to={value.phone} key={i}>
						<div>{value.name.trim() != '' ? value.name : 'Nom inconnu'}</div>
						<div className="Phone">{cleanNumber(value.phone)}</div>
					</Link>
				);
			})}
		</div>
	);
}

function Search({ credentials }: { credentials: Credentials }) {
	const [Clients, setClients] = useState<Array<SearchClient> | null>(null);

	function searchPhone(phone: string) {
		return new Promise<Array<SearchClient> | undefined>(resolve => {
			axios
				.post(credentials.URL + '/admin/client/searchByPhone', {
					area: credentials.content.areaId,
					adminCode: credentials.content.password,
					phone: phone
				})
				.then(res => {
					if (res.data.OK) {
						resolve(res.data.data);
					} else {
						resolve(undefined);
					}
				})
				.catch(err => {
					console.error(err);
					resolve(undefined);
				});
		});
	}

	function searchName(name: string) {
		return new Promise<Array<SearchClient> | undefined>(resolve => {
			axios
				.post(credentials.URL + '/admin/client/searchByName', {
					area: credentials.content.areaId,
					adminCode: credentials.content.password,
					name: name
				})
				.then(res => {
					if (res.data.OK) {
						resolve(res.data.data);
					} else {
						resolve(undefined);
					}
				})
				.catch(err => {
					console.error(err);
					resolve(undefined);
				});
		});
	}

	function action() {
		const phone = (document.getElementById('phone') as HTMLInputElement).value.trim();
		const name = (document.getElementById('name') as HTMLInputElement).value.trim();

		if (name == '' && phone == '') {
			setClients(null);
			return;
		}
		if (phone != '') {
			searchPhone(phone).then(res => {
				if (!res) return;
				setClients(res);
			});
		} else {
			searchName(name).then(res => {
				if (!res) return;
				setClients(res);
			});
		}
	}

	function changePhone() {
		(document.getElementById('name') as HTMLInputElement).value = '';

		const oldValue = (document.getElementById('phone') as HTMLInputElement).value;
		setTimeout(() => {
			const value = (document.getElementById('phone') as HTMLInputElement).value;
			if (oldValue == value) {
				action();
			}
		}, 250);
	}

	function changeName() {
		(document.getElementById('phone') as HTMLInputElement).value = '';

		const oldValue = (document.getElementById('name') as HTMLInputElement).value;
		setTimeout(() => {
			const value = (document.getElementById('name') as HTMLInputElement).value;
			if (oldValue == value) {
				action();
			}
		}, 250);
	}

	function enter(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key == 'Enter') {
			action();
		}
	}

	return (
		<div className="ExplorePage">
			<h1>Rechercher un contact</h1>
			<div>
				<div>
					<input
						onKeyUp={enter}
						id="phone"
						placeholder="Téléphone"
						type="tel"
						className="inputField"
						onChange={changePhone}
					/>
					<input
						onKeyUp={enter}
						id="name"
						placeholder="Nom"
						type="text"
						className="inputField"
						onChange={changeName}
					/>
				</div>
				<Client clients={Clients} />
			</div>
		</div>
	);
}

function ClientDetail({ credentials, campaign }: { credentials: Credentials; campaign: Campaign }) {
	const { phone } = useParams();
	const [Client, setClient] = useState<Client | null | undefined>(undefined);
	const [Calls, setCalls] = useState<Array<JSX.Element> | undefined>(undefined);

	const [ButtonValue, setButtonValue] = useState('Supprimer');
	const [ButtonDisabled, setButtonDisabled] = useState(false);

	const navigate = useNavigate();

	function getInfos() {
		return new Promise<ClientInfos | undefined>(resolve => {
			axios
				.post(credentials.URL + '/admin/client/clientInfo', {
					adminCode: credentials.content.password,
					area: credentials.content.areaId,
					phone: phone
				})
				.then(res => {
					if (res.data.OK) {
						res.data.data.client.data[campaign._id] = res.data.data.client.data[campaign._id].map(
							(el: Call) => {
								el.startCall = new Date(el.startCall);
								el.endCall = new Date(el.endCall);
								return el;
							}
						);
						resolve(res.data.data);
					} else {
						resolve(undefined);
					}
				})
				.catch(err => {
					console.error(err);
					resolve(undefined);
				});
		});
	}

	function sendRemoval(phone: string) {
		return new Promise<boolean>(resolve => {
			axios
				.post(credentials.URL + '/admin/client/removeClient', {
					area: credentials.content.areaId,
					adminCode: credentials.content.password,
					phone: phone
				})
				.then(() => resolve(true))
				.catch(err => {
					console.error(err);
					resolve(false);
				});
		});
	}

	useEffect(() => {
		getInfos().then(res => {
			if (res) {
				setClient(res.client);
				if (!res.callers.length) {
					return;
				}
				const calls = new Array();
				calls.push(
					<b key={-5}>Date/Heure</b>,
					<b key={-4}>Durée</b>,
					<b key={-3}>Appelant·e</b>,
					<b key={-1}>Résultat</b>
				);
				res.client.data[campaign._id].forEach((element, i) => {
					if (element.status == 'not called') {
						return;
					}

					function GetCallBounds() {
						if (element.startCall.toLocaleDateString() == 'Invalid Date') {
							return <>Inconnue</>;
						}
						return (
							<>
								<span className="Phone">{element.startCall.toLocaleDateString()}</span>
								{' à '}
								<span className="Phone">{element.startCall.toLocaleTimeString()}</span>
							</>
						);
					}

					const duration = getCallDuration(element.startCall, element.endCall);

					calls.push(
						<span key={i + 'a'}>
							<GetCallBounds />
						</span>,
						<span key={i + 'b'} className="Phone">
							{duration}
						</span>,
						<span key={i + 'c'}>{res.callers.find(el => el.id == element.caller)?.name}</span>,
						<span key={i + 'e'}>{cleanSatisfaction(element.satisfaction)}</span>
					);
				});
				setCalls(calls);
			} else {
				navigate('/Clients/Explore');
			}
		});
	}, []);

	function remove() {
		if (Client) {
			setButtonDisabled(true);
			setButtonValue('Suppression...');
			sendRemoval(Client.phone).then(res => {
				if (res) {
					navigate('/Clients');
				} else {
					setButtonDisabled(false);
					setButtonValue('Une erreur est survenue');
				}
			});
		}
	}

	return (
		<div className="GenericPage ClientPage">
			<h1>Informations d'un contact</h1>
			<span>
				<span>
					Nom:<h4>{Client ? Client.name : 'Récupération en cours...'}</h4>
				</span>
				<span>
					Téléphone: <span className="Phone">{Client ? cleanNumber(Client.phone as string) : ''}</span>
				</span>
				<Button value={ButtonValue} type={ButtonDisabled ? 'ButtonDisabled' : 'RedButton'} onclick={remove} />
			</span>
			<div>
				{Calls ? (
					<>
						<b>Appels:</b>
						<div className="ClientCalls">{Calls}</div>
					</>
				) : (
					<b>Aucun appel</b>
				)}
			</div>
		</div>
	);
}

function Explore({ credentials, campaign }: { credentials: Credentials; campaign: Campaign }) {
	return (
		<Routes>
			<Route path="/" element={<Search credentials={credentials} />} />
			<Route path="/:phone" element={<ClientDetail campaign={campaign} credentials={credentials} />} />
			<Route path="/*" element={<E404 />} />
		</Routes>
	);
}

export default Explore;
