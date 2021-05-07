import convict from 'convict';
import { Transport } from '@nestjs/common/enums/transport.enum';

convict.addParser({ extension: 'json', parse: require('json5').parse });

// Define a schema
const config = convict({
  env: {
    doc: 'The application environment',
    format: ['production', 'development', 'testing'],
    default: 'development',
    env: 'NODE_ENV'
  },
  db: {
    mongo: {
      uri: {
        doc: 'MongoDB endpoint URI',
        env: 'DB_MONGO_URI',
        format: String,
        default: 'mongodb://127.0.0.1:4433/connector'
      }
    },
    redis: {
      host: {
        doc: 'Redis host name/IP',
        format: '*',
        default: '127.0.0.1',
        env: 'DB_REDIS_HOST'
      },
      options: {
        transport: {
          doc: 'Transport type',
          format: Number,
          default: Transport.REDIS
        },
        options: {
          url: {
            doc: 'Full Redis endpoint URL',
            format: String,
            default: 'redis://127.0.0.1:6379'
          }
        }
      },
      password: {
        doc: 'Redis password',
        format: String,
        default: '',
        env: 'DB_REDIS_PASSWORD',
        sensitive: true
      },
      port: {
        doc: 'Redis port',
        format: Number,
        default: 6379,
        env: 'DB_REDIS_PORT'
      }
    }
  },
  mail: {
    adminAlertAddress: {
      doc: 'Address emailed by app Admin alerts.',
      format: String,
      default: 'dev@solarixdigital.com',
      env: 'MAIL_ADMIN_ALERT_ADDRESS'
    },
    host: {
      doc: 'Mail host',
      format: String,
      default: 'smtp.sendgrid.net',
      env: 'MAIL_HOST'
    },
    port: {
      doc: 'Mail port',
      format: Number,
      default: 587,
      env: 'MAIL_PORT'
    },
    username: {
      doc: 'Mail username',
      format: String,
      default: 'apikey',
      env: 'MAIL_USERNAME'
    },
    password: {
      doc: 'Mail password',
      format: String,
      default: '',
      env: 'MAIL_PASSWORD'
    },
    from: {
      address: {
        doc: 'Address mail is sent from',
        format: String,
        default: 'connector@wcasg.com',
        env: 'MAIL_FROM_ADDRESS'
      },
      name: {
        doc: 'Name of from sender',
        format: String,
        default: 'WCASG Connector',
        env: 'MAIL_FROM_NAME'
      }
    }
  },
  port: {
    doc: 'App port',
    format: Number,
    default: 4321,
    env: 'PORT'
  },
  queue: {
    attempts: {
      doc: 'Default number of attempts for failed jobs.',
      format: Number,
      default: 10,
      env: 'QUEUE_ATTEMPTS'
    },
    backoff: {
      doc:
        'Default backoff strategy for failed jobs ("fixed" or "exponential").',
      format: String,
      default: 'exponential',
      env: 'QUEUE_BACKOFF'
    },
    delay: {
      doc: 'Default delay between job attempts.',
      format: Number,
      default: 15000,
      env: 'QUEUE_DELAY'
    },
    intuit: {
      db: {
        name: {
          format: String,
          default: 'intuit'
        }
      },
      name: {
        format: String,
        default: 'intuit'
      },
      types: {
        healthcheck: {
          format: String,
          default: 'healthcheck'
        },
        refresh: {
          format: String,
          default: 'refresh'
        }
      }
    },
    mail: {
      db: {
        name: {
          format: String,
          default: 'mail'
        }
      },
      name: {
        format: String,
        default: 'mail'
      },
      types: {
        send: {
          format: String,
          default: 'send'
        },
        special: {
          format: String,
          default: 'special'
        }
      }
    },
    stripe: {
      db: {
        name: {
          format: String,
          default: 'stripe'
        }
      },
      name: {
        format: String,
        default: 'stripe-webhook'
      }
    }
  },
  routes: {
    intuit: {
      authorize: {
        doc: 'Intuit authorization endpoint',
        format: String,
        default: '/intuit/authorize',
        env: 'ROUTE_INTUIT_AUTHORIZE'
      },
      callback: {
        doc: 'Intuit callback endpoint',
        format: String,
        default: '/intuit/callback',
        env: 'ROUTE_INTUIT_CALLBACK'
      }
    },
    stripe: {
      webhook: {
        doc: 'Stripe Webhook endpoint',
        format: String,
        default: '/stripe/webhook',
        env: 'ROUTE_STRIPE_WEBHOOK'
      }
    },
    prefix: {
      doc: 'API versioning prefix',
      format: String,
      default: '/v1',
      env: 'ROUTE_PREFIX'
    },
    root: {
      doc: 'Default base API endpoint',
      format: String,
      default: 'http://connector.local:4321',
      env: 'ROUTE_ROOT'
    }
  },
  security: {
    ssl: {
      certificate: {
        format: String,
        default:
          '/home/ubuntu/certs/connector.widget.wcasg.solarix.host/connector.widget.wcasg.solarix.host.cer'
      },
      enabled: {
        format: Boolean,
        default: true
      },
      key: {
        format: String,
        default:
          '/home/ubuntu/certs/connector.widget.wcasg.solarix.host/connector.widget.wcasg.solarix.host.key'
      }
    }
  },
  services: {
    aws: {
      cloudwatch: {
        awsAccessKeyId: {
          doc: 'AWS CloudWatch Access Key',
          format: String,
          default: 'abc123',
          env: 'AWS_CLOUDWATCH_ACCESS_KEY'
        },
        awsSecretKey: {
          doc: 'AWS CloudWatch Secret Key',
          format: String,
          default: 'abc123',
          env: 'AWS_CLOUDWATCH_SECRET_KEY'
        },
        awsRegion: {
          doc: 'AWS CloudWatch region',
          format: String,
          default: 'us-west-2',
          env: 'AWS_CLOUDWATCH_REGION'
        },
        logGroupName: {
          doc: 'AWS CloudWatch log group name',
          format: String,
          default: 'wcasg',
          env: 'AWS_CLOUDWATCH_LOG_GROUP_NAME'
        },
        logStreamName: {
          doc: 'AWS CloudWatch log stream name',
          format: String,
          default: 'connector',
          env: 'AWS_CLOUDWATCH_LOG_STREAM_NAME'
        },
        retentionInDays: {
          doc: 'AWS CloudWatch retention days',
          format: Number,
          default: 3,
          env: 'AWS_CLOUDWATCH_RETENTION_DAYS'
        }
      }
    },
    intuit: {
      api: {
        url: {
          doc: 'Intuit API base endpoint',
          format: String,
          default: 'sandbox-quickbooks.api.intuit.com',
          env: 'INTUIT_API_BASE_URL'
        },
        version: {
          doc: 'Intuit API minor version',
          format: Number,
          default: 47,
          env: 'INTUIT_API_MINOR_VERSION'
        }
      },
      auth: {
        autoHealthcheckCronSchedule: {
          doc: 'Cron schedule for auto-healthcheck of Intuit API connection.',
          format: String,
          // Every 5 minutes
          default: '*/5 * * * *',
          env: 'INTUIT_AUTH_AUTO_HEALTHCHECK_CRON_SCHEDULE'
        },
        autoRefreshCronSchedule: {
          doc: 'Cron schedule for auto-refreshing Intuit API auth tokens.',
          format: String,
          // Every 5 minutes
          default: '*/5 * * * *',
          env: 'INTUIT_AUTH_AUTO_REFRESH_CRON_SCHEDULE'
        },
        clientId: {
          doc: 'Intuit client id',
          format: String,
          default: 'abc123',
          env: 'INTUIT_AUTH_CLIENT_ID',
          sensitive: true
        },
        clientSecret: {
          doc: 'Intuit client secret',
          format: String,
          default: '',
          env: 'INTUIT_AUTH_CLIENT_SECRET',
          sensitive: true
        },
        refreshToken: {
          doc: 'Intuit initial refresh token',
          format: String,
          default: '',
          env: 'INTUIT_AUTH_REFRESH_TOKEN',
          sensitive: true
        },
        token: {
          doc: 'Intuit initial token',
          format: String,
          default: '',
          env: 'INTUIT_AUTH_TOKEN',
          sensitive: true
        }
      },
      company: {
        doc: 'Intuit company identifier',
        format: String,
        default: 'abc123',
        env: 'INTUIT_COMPANY_ID'
      },
      environment: {
        doc: 'Intuit environment',
        format: String,
        default: 'sandbox',
        env: 'INTUIT_ENVIRONMENT'
      },
      settings: {
        account: {
          id: {
            doc:
              'Id of account to track Product/Service objects created by import',
            format: Number,
            default: 1,
            env: 'INTUIT_SERVICE_ITEM_INCOME_ACCOUNT_ID'
          },
          name: {
            doc: 'Account name used to track objects created by import',
            format: String,
            default: 'Services',
            env: 'INTUIT_SERVICE_ITEM_INCOME_ACCOUNT_NAME'
          }
        }
      }
    },
    stripe: {
      key: {
        doc: 'Stripe key',
        format: String,
        default: '',
        env: 'STRIPE_KEY',
        sensitive: true
      },
      secret: {
        doc: 'Stripe secret',
        format: String,
        default: '',
        env: 'STRIPE_SECRET',
        sensitive: true
      },
      webhook: {
        secret: {
          doc: 'Stripe webhook secret',
          format: String,
          default: '',
          env: 'STRIPE_WEBHOOK_SECRET',
          sensitive: true
        }
      }
    }
  }
});

// Load environment dependent configuration
const env = config.get('env');
config.loadFile('config/' + env + '.json');

// Perform validation
config.validate({ allowed: 'strict' });

export default config;
