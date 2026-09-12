/**
 * Theme state for the Ynex layout. The switcher dispatches the whole object back
 * through the `ThemeChanger` action, and Rootwrapper maps it onto <html> data
 * attributes plus the :root CSS variables.
 */
const initialState = {
    lang: 'en',
    dir: 'ltr',
    class: 'light',
    dataMenuStyles: 'dark',
    dataNavLayout: 'vertical',
    dataHeaderStyles: 'light',
    dataVerticalStyle: 'overlay',
    dataToggled: '',
    dataNavStyle: '',
    horStyle: '',
    dataPageStyle: 'regular',
    dataWidth: 'fullwidth',
    dataMenuPosition: 'fixed',
    dataHeaderPosition: 'fixed',
    loader: 'disable',
    iconOverlay: '',
    colorPrimaryRgb: '',
    colorPrimary: '',
    bodyBg: '',
    Light: '',
    darkBg: '',
    inputBorder: '',
    bgImg: '',
    iconText: '',
    // Rootwrapper reads `body.class`; the switcher's reset writes the same shape.
    body: { class: '' },
};

export type ThemeState = typeof initialState;

export default function reducer(state: ThemeState = initialState, action: any): ThemeState {
    const { type, payload } = action;

    switch (type) {
        case 'ThemeChanger':
            return payload;

        default:
            return state;
    }
}
