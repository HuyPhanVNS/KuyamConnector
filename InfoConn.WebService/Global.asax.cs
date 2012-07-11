using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.SessionState;
using Castle.Windsor;
using InfoConn.Service;
using Castle.MicroKernel.Registration;
using InfoConn.Config;
using InfoConn.Services;
using InfoConn.Core;
using InfoConn.Data.Respositories;
using InfoConn.Data.Services;
using InfoConn.Data;
using System.Data.Entity;

namespace InfoConn.WebService
{
    public class Global : System.Web.HttpApplication
    {
        protected void Application_Start(object sender, EventArgs e)
        {
            Database.SetInitializer<InfoConnContext>(new DataBaseInitalizer());
            RegisterComponentsWith();
        }

        private static void RegisterComponentsWith()
        {
            IoC.Register(Component.For<IDbContext>().ImplementedBy<InfoConnContext>().LifeStyle.Transient);
            IoC.Register(Component.For<IConnectorSourceRepository>().ImplementedBy<ConnectorSourceRepository>().LifeStyle.Transient);
            IoC.Register(Component.For<IEventRepository>().ImplementedBy<EventRepository>().LifeStyle.Transient);
            IoC.Register(Component.For<ICalendarRepository>().ImplementedBy<CalendarRepository>().LifeStyle.Transient);

            IoC.Register(Component.For<IEventService>().ImplementedBy<EventService>().LifeStyle.Singleton);
            IoC.Register(Component.For<ICalendarService>().ImplementedBy<CalendarService>().LifeStyle.Singleton);
            IoC.Register(Component.For<IConnectorSourceService>().ImplementedBy<ConnectorSourceService>().LifeStyle.Singleton);

            IoC.Register(Component.For<ISettingService>().ImplementedBy<SettingService>().LifeStyle.Singleton);
            IoC.Register(Component.For<IConnectorManager>().ImplementedBy<ConnectorManager>().LifeStyle.Singleton);
            IoC.Register(Component.For<IConnectorService>().ImplementedBy<ConnectorService>().LifeStyle.Singleton);
        }

        protected void Session_Start(object sender, EventArgs e)
        {

        }

        protected void Application_BeginRequest(object sender, EventArgs e)
        {

        }

        protected void Application_AuthenticateRequest(object sender, EventArgs e)
        {

        }

        protected void Application_Error(object sender, EventArgs e)
        {

        }

        protected void Session_End(object sender, EventArgs e)
        {

        }

        protected void Application_End(object sender, EventArgs e)
        {

        }
    }
}