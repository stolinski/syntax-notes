import { PUBLIC_GITHUB_ID } from '$env/static/public';
import { GITHUB_SECRET } from '$env/static/private';
const tokenURL = 'https://github.com/login/oauth/access_token';

export async function GET({ url, cookies }) {
	const code = url.searchParams.get('code');
	console.log('code', code);
	const accessToken = await getAccessToken(code);
	console.log('accessToken', accessToken);
	cookies.set('oauth', accessToken, {
		httpOnly: true,
		path: '/'
	});

	return new Response('', {
		status: 302,
		headers: {
			location: '/shows'
		}
	});
}

function getAccessToken(code) {
	return fetch(tokenURL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({
			client_id: PUBLIC_GITHUB_ID,
			client_secret: GITHUB_SECRET,
			code
		})
	})
		.then((r) => r.json())
		.then((r) => {
			console.log('r', r);

			return r.access_token;
		});
}
