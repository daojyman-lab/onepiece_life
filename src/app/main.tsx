import { render } from 'preact';
import 'galmuri/dist/galmuri.css';
import '@fontsource/press-start-2p/400.css';
import '../ui/styles/pixel.css';
import { App } from '../ui/App';

render(<App />, document.getElementById('app')!);
