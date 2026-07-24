import { App } from './app';
import { AppSettingsInterface, DisplayStyle } from './app/settings/base';
import { MemorySettingsInterface } from './app/settings/memory';
import * as versionInfo from './assets/version.json';
import { Logger } from './log';
import './style.scss';
import './styles/config.scss';

const LOG = new Logger('CONFIG.html');

function abort(error: string) {
  alert(error);
  return new Error(error);
}

function onAppChanged(value: string) {
  LOG.info('Changing app to', value);
  document.querySelectorAll('[data-show-when-app]').forEach((i) => {
    (i as HTMLElement).style.display = 'none';
  });
  document.querySelectorAll(`[data-show-when-app="${value}"]`).forEach((i) => {
    (i as HTMLElement).style.display = '';
  });
}

function onTimeDisplayChange(
  settings: AppSettingsInterface,
  value: DisplayStyle,
) {
  LOG.info('Changing time display to', value);
  settings.saveSettings({
    ...settings.currentSettings,
    timeStyle: value,
  });
}

function onColorChange(settings: AppSettingsInterface, value: string) {
  LOG.info('Changing color to', value);
  settings.saveSettings({
    ...settings.currentSettings,
    color: value,
  });
}

function onFadeTimeChanged(
  settings: AppSettingsInterface,
  prop: ('fadeInTime' | 'fadeOutTime' | 'backglow') | string,
  value: number,
) {
  LOG.info('fade input changed', prop, value);
  settings.saveSettings({
    ...settings.currentSettings,
    [prop]: value,
  });
}

LOG.info('Initializing app');
const versionSpan = document.querySelector<HTMLSpanElement>('#version');
if (versionSpan) {
  const version = [
    versionInfo.version.major,
    versionInfo.version.minor,
    versionInfo.version.patch,
  ]
    .map((i) => `${i}`.padStart(2, '0'))
    .join('.');
  versionSpan.textContent = `v${version} b${versionInfo.version.revision}`;
}

const previewRoot = document.querySelector<HTMLDivElement>('#preview');
if (!previewRoot) {
  throw abort('Preview Root not found!');
}

const settings = new MemorySettingsInterface();
const previewApp = new App(previewRoot, 30, settings);

const form = document.querySelector<HTMLFormElement>('#launchForm');
if (!form) {
  throw abort('Form not found!');
}

const appDropdown = form.querySelector<HTMLSelectElement>('select[name=app]');
if (!appDropdown) {
  throw abort('App dropdown missing');
}

const timeStyleDropdown = form.querySelector<HTMLSelectElement>(
  'select[name=timeStyle]',
);
if (!timeStyleDropdown) {
  throw abort('Time style dropdown missing');
}

const fadeTimeInputs = [
  form.querySelector<HTMLInputElement>('input[type=number][name=fadeInTime]'),
  form.querySelector<HTMLInputElement>('input[type=number][name=fadeOutTime]'),
  form.querySelector<HTMLInputElement>('input[type=number][name=backglow]'),
].filter((i) => !!i);
if (fadeTimeInputs.length === 0) {
  throw abort('Fade Time inputs missing');
}
fadeTimeInputs.forEach((input) => {
  input.onchange = (e) => {
    const inputElement = e.currentTarget as HTMLInputElement;
    onFadeTimeChanged(
      settings,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inputElement.attributes.getNamedItem('name')!.value,
      inputElement.valueAsNumber,
    );
  };
});

appDropdown.onchange = (e) =>
  onAppChanged((e?.target as HTMLSelectElement)?.value);
timeStyleDropdown.onchange = (e) =>
  onTimeDisplayChange(
    settings,
    (e.target as HTMLSelectElement).value as DisplayStyle,
  );

const colorInput = form.querySelector<HTMLInputElement>(
  'input[type=color][name=color]',
);
if (!colorInput) {
  throw abort('Color input missing');
}
colorInput.onchange = (e) =>
  onColorChange(settings, (e.target as HTMLInputElement).value);
colorInput.oninput = (e) =>
  onColorChange(settings, (e.target as HTMLInputElement).value);

setTimeout(() => {
  onAppChanged(appDropdown.value);
  onTimeDisplayChange(settings, timeStyleDropdown.value as DisplayStyle);
  onFadeTimeChanged(settings, 'fadeInTime', fadeTimeInputs[0].valueAsNumber);
  onFadeTimeChanged(settings, 'fadeOutTime', fadeTimeInputs[1].valueAsNumber);
  onFadeTimeChanged(settings, 'backglow', fadeTimeInputs[2].valueAsNumber);
  onColorChange(settings, colorInput.value);
  previewApp.startTicking();
}, 100);
