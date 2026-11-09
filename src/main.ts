// Editor che le schede generate dai metadati chiedono per nome (editorType):
// il dxForm crea da solo solo TextBox, DateBox, CheckBox e NumberBox, gli
// altri vanno importati, altrimenti resta l'etichetta senza il campo
import 'devextreme/ui/color_box';

import { bootstrapApplication } from '@angular/platform-browser';
import { caricaConfigurazione } from '@zng/core/services/configurazione';
import { configuraDevExtreme } from '@zng/core/services/devextreme';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { licenseKey } from './devextreme-license';
import { environment } from './environments/environment';

// DevExtreme come in Agorà (zNg): editor 'outlined', euro, testi in
// italiano, griglie e popup adatti a tablet e telefono. La chiave di
// esecuzione, unica per tutte le configurazioni, la rigenera
// strumenti\genera-chiave-devextreme.cmd a ogni versione maggiore di DevExtreme
configuraDevExtreme({ licenseKey });

// Prima la configurazione dell'installazione (config.json), poi l'avvio: i
// servizi leggono l'indirizzo di zServer quando nascono. Un errore qui
// lascerebbe la pagina bianca: il motivo si scrive nella pagina stessa.
caricaConfigurazione({ apiUrl: environment.apiUrl })
  .then(() => bootstrapApplication(AppComponent, appConfig))
  .catch((errore) => mostraErroreAvvio(errore));

function mostraErroreAvvio(errore: unknown): void {
  console.error(errore);
  const messaggio = document.createElement('pre');
  messaggio.textContent = `GestyWeb non si avvia.\n\n${errore instanceof Error ? errore.message : String(errore)}`;
  messaggio.style.cssText = 'margin: 24px; font: 14px sans-serif; white-space: pre-wrap;';
  document.body.replaceChildren(messaggio);
}
