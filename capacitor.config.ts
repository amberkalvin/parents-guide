import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.parentsguide.pg13',
    appName: "parent's guide PG13",
    webDir: 'out',
    plugins: {
        CapacitorHttp: {
            enabled: true,
        },
    },
};

export default config;
