import { useEffect, useState } from "react";

import {

  ensureAuthSessionBootstrapped,

  getAuthBootstrapAccessToken,

  subscribeAuthBootstrapSession,

} from "../auth/authBootstrapService";



/** Sessão Supabase pronta para chamadas autenticadas à API. */

export function useAuthBootstrapReady() {

  const [ready, setReady] = useState(false);



  useEffect(() => {

    let cancelled = false;



    ensureAuthSessionBootstrapped().then(() => {

      if (!cancelled) {

        setReady(Boolean(getAuthBootstrapAccessToken()));

      }

    });



    const unsubscribe = subscribeAuthBootstrapSession(() => {

      if (!cancelled) {

        setReady(Boolean(getAuthBootstrapAccessToken()));

      }

    });



    return () => {

      cancelled = true;

      unsubscribe();

    };

  }, []);



  return ready;

}

