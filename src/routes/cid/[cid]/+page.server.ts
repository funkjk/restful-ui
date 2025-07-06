import { error } from '@sveltejs/kit';
import { loadConfig } from '$lib/restful/config-server/ConfigStore';

export const load = async ({ params }: { params: { cid: string } }) => {

    const {cid} = params
    const config = await loadConfig(cid)
    if (config) {
        return config
    }

	error(404, 'Not found');
};