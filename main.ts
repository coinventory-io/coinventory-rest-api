import { series, waterfall } from 'async';
import { createLogger } from 'bunyan';
import { get_models_routes, IModelRoute, populateModelRoutes, raise } from 'nodejs-utils';
import { IOrmMwConfig, IOrmReq, IOrmsOut, ormMw } from 'orm-mw';
import { Server } from 'restify';
import { IRoutesMergerConfig, routesMerger, TApp } from 'routes-merger';

import { AccessToken } from './api/auth/models';
import { AuthTestSDK } from './test/api/auth/auth_test_sdk';
import { User } from './api/user/models';
import * as config from './config';
import { getOrmMwConfig, getPrivateIPAddress } from './config';
import { post as register_user, UserBodyReq, UserConfig } from './api/user/sdk';

/* tslint:disable:no-var-requires */
export const package_ = Object.freeze(require('./package'));
export const logger = createLogger({ name: 'main' });

/* tslint:disable:no-unused-expression */
process.env['NO_DEBUG'] || logger.info(Object.keys(process.env).sort().map(k => ({ [k]: process.env[k] })));

export const all_models_and_routes: Map<string, any> = populateModelRoutes(__dirname);
export const all_models_and_routes_as_mr: IModelRoute = get_models_routes(all_models_and_routes);

export const setupOrmApp = (models_and_routes: Map<string, any>,
                            mergeOrmMw: Partial<IOrmMwConfig>,
                            mergeRoutesConfig: Partial<IRoutesMergerConfig>,
                            callback: (err: Error, app?: TApp, orms_out?: IOrmsOut) => void) => waterfall([
    cb => ormMw(Object.assign({}, getOrmMwConfig(models_and_routes, logger, cb), mergeOrmMw)),
    (with_app: IRoutesMergerConfig['with_app'], orms_out: IOrmsOut, cb) =>
        routesMerger(Object.assign({}, {
            routes: models_and_routes,
            server_type: 'restify',
            package_: { version: package_.version },
            app_name: package_.name,
            root: '/api',
            skip_app_version_routes: false,
            skip_start_app: false,
            skip_app_logging: false,
            listen_port: process.env.PORT || 3000,
            version_routes_kwargs: { private_ip: getPrivateIPAddress() },
            with_app,
            logger,
            onServerStart: (uri: string, app: Server, next) => {
                AccessToken.reset();

                const authSdk = new AuthTestSDK(app);

                const envs = ['DEFAULT_ADMIN_EMAIL', 'DEFAULT_ADMIN_PASSWORD'];
                if (!envs.every(process.env.hasOwnProperty.bind(process.env)))
                    throw ReferenceError(`${envs.join(', ')} must all be defined in your environment`);

                const default_admin: User = {
                    email: process.env.DEFAULT_ADMIN_EMAIL,
                    password: process.env.DEFAULT_ADMIN_PASSWORD,
                    roles: ['registered', 'login', 'admin']
                };

                series([
                        callb => authSdk.unregister_all([default_admin], (err: Error & {status: number}) =>
                            callb(err != null && err.status !== 404 ? err : void 0,
                                'removed default user; next: adding')),
                        callb => register_user({
                            getOrm: () => config._orms_out.orms_out,
                            orms_out: config._orms_out.orms_out,
                            body: default_admin
                        } as IOrmReq & {body?: User} as UserBodyReq, UserConfig.default(), callb),
                        callb => {
                            UserConfig.instance = { public_registration: false, initial_accounts: [default_admin] };
                            return callb(void 0);
                        },
                        callb =>
                            typeof logger.info(`${app.name} listening from ${app.url}`) === 'undefined' && callb(void 0)
                    ], (e: Error) => e == null ? next(void 0, app, orms_out) : raise(e)
                );
            },
            callback: (err: Error, app: TApp) => cb(err, app, orms_out)
        }, mergeRoutesConfig))
], callback);

if (require.main === module)
    setupOrmApp(all_models_and_routes, { logger }, { logger, skip_start_app: false },
        (err: Error, app: TApp, orms_out: IOrmsOut) => {
            if (err != null) throw err;
            config._orms_out.orms_out = orms_out;
        }
    );
