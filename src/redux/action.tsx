import type { ThemeState } from './reducer';

/** The switcher replaces the whole theme object in one dispatch. */
export const ThemeChanger = (value: ThemeState) => async (dispatch: (action: unknown) => void) => {
    dispatch({
        type: 'ThemeChanger',
        payload: value,
    });
};
