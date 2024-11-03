import { persisted } from 'svelte-persisted-store'
import { derived, writable } from 'svelte/store'

export const settings = persisted('cloudhub.settings', {
    extensionId:"",
    envId:"",
    orgId:"",
    tokenString:"",
    isAuthorized: false
})


export const isInitilized = derived(settings, (v) => {
    return v.extensionId !== "" && v.tokenString !== "" && v.orgId !== "" && v.envId !== ""
})
