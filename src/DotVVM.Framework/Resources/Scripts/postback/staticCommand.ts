import { serialize } from '../serialization/serialize';
import { deserialize } from '../serialization/deserialize';
import { getViewModel, getInitialUrl } from '../dotvvm-base';
import * as events from '../events';
import * as updater from './updater';
import * as http from './http'
import { handleRedirect } from './redirect';
import { DotvvmPostbackError } from '../shared-classes';

export async function staticCommandPostback(sender: HTMLElement, command: string, args: any[]): Promise<any> {

    let data: any;
    try {
        return await http.retryOnInvalidCsrfToken(async () => {
            const csrfToken = await http.fetchCsrfToken();

            data = serialize({ args, command, $csrfToken: csrfToken });

            events.staticCommandMethodInvoking.trigger(data);

            const response = await http.postJSON<any>(
                getInitialUrl(),
                JSON.stringify(data),
                { "X-PostbackType": "StaticCommand" }
            );

            const result = response.result;
            if ("action" in response) {
                if (response.action == "redirect") {
                    // redirect
                    handleRedirect(response);
                    return;
                } else {
                    throw new Error(`Invalid action ${response.action}`);
                }
            }
            events.staticCommandMethodInvoked.trigger({ ...data, result });

            return result;
        });
    } catch (err) {
        events.staticCommandMethodFailed.trigger({ ...data, error: err })
        
        if (err instanceof DotvvmPostbackError) {
            const r = err.reason;
            if (r.type == "network") {
                events.error.trigger({ sender, handled: false, serverResponseObject: r.err });
                return;
            }
        }
        events.error.trigger({ sender, handled: false, serverResponseObject: err });

        throw err;
    }
}