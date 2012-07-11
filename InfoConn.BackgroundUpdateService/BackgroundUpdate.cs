using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.ServiceProcess;
using System.Text;
using System.Configuration;
using System.Threading;
using InfoConn.Services;
using InfoConn.Data;
#region CACHING_CODE
using InfoConn.Core.Domain;
#endregion
using InfoConn.Data.Respositories;
using InfoConn.Data.Services;
using InfoConn.Config;
using InfoConn.Service;
using InfoConn.Core;
using Castle.MicroKernel.Registration;

namespace InfoConn.BackgroundUpdateService
{    
    public partial class BackgroundUpdate : ServiceBase
    {
        #region CACHING_CODE
        // TODO: this is just quick fix. Should be loaed from config, should be property, etc.
        public int[] CacheHours = {
            0,          // Skip [index = 0]
            4,          // Short [index = 1]
            7 * 24,     // Medium [index = 2]
            7 * 24      // Longer [index = 3] (note, this is base, need to add more hours out based on request)
        };
        #endregion

        public BackgroundUpdate()
        {
            InitializeComponent();

            int timeInterval;
            int.TryParse(ConfigurationManager.AppSettings["ServiceTimeInterval"] ?? "10000", out timeInterval);
            if (timeInterval < 1000)
            {
                timeInterval = 20000;
            }

            _mainThreadInterval = timeInterval;

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
        #region Fields and Properties

        EventLog _eventLog;
        public override EventLog EventLog
        {
            get
            {
                if (_eventLog == null)
                {
                    _eventLog = new EventLog();

                    string logSource = ConfigurationManager.AppSettings["LogSource"];
                    if (string.IsNullOrEmpty(logSource))
                        logSource = "InfoConnBackgroundUpdateService";
                    string logName = ConfigurationManager.AppSettings["LogName"];
                    if (string.IsNullOrEmpty(logName))
                        logName = "InfoConnBackgroundUpdateService log";

                    if (!EventLog.SourceExists(logSource))
                    {
                        EventLog.CreateEventSource(logSource, logName);
                    }

                    EventLog.Source = logSource;
                    EventLog.Log = logName;
                    EventLog.ModifyOverflowPolicy(OverflowAction.OverwriteAsNeeded, 7);
                    EventLog.MaximumKilobytes = 640000;
                }

                return _eventLog;
            }
        }


        Thread _mainThread;

        protected Thread MainThread
        {
            get { return _mainThread; }
            private set { _mainThread = value; }
        }

        List<BackgroundUpdateThread> _childThreads;

        protected List<BackgroundUpdateThread> ChildThreads
        {
            get { return _childThreads; }
            set { _childThreads = value; }
        }

        bool _isRunning = false;
        readonly int _mainThreadInterval;

        #endregion


        protected override void OnStart(string[] args)
        {
            try
            {
                EventLog.WriteEntry("Start Background Update service at " + DateTime.Now.ToString(), EventLogEntryType.Information);
            }
            catch
            {
                //do nothing
            }

            ChildThreads = new List<BackgroundUpdateThread>();
            MainThread = new Thread(new ParameterizedThreadStart(DoCacheWork));
            _isRunning = true;
            MainThread.Start();
        }
      
        #region CACHING_CODE
        // TODO: copy this for Medium and Longer
        // TODO: or make the CacheType a parameter.
        void DoCacheWork(object sender)
        {
            var connectSourceService = IoC.Resolve<IConnectorService>();
            while (_isRunning)
            {
                try
                {
                    ChildThreads = new List<BackgroundUpdateThread>();
                    //var connectorSources = IoC.Resolve<IConnectorSourceService>().GetConnectorSourceNeedToUpdateCache(4);

                    // New: specific to this cache.
                    // TODO: change Short to Medium and Longer versions.
                    List<ConnectorSource> connectorSourcesShort = IoC.Resolve<IConnectorSourceService>().GetConnectorSourceNeedToUpdateCache(CacheType.Short, -1);
                    List<ConnectorSource> connectorSourcesMedium = IoC.Resolve<IConnectorSourceService>().GetConnectorSourceNeedToUpdateCache(CacheType.Medium, CacheHours[(int)CacheType.Medium]);
                    List<ConnectorSource> connectorSourcesLong = IoC.Resolve<IConnectorSourceService>().GetConnectorSourceNeedToUpdateCache(CacheType.Longer, CacheHours[(int)CacheType.Longer]);

                    foreach (var connectorSource in connectorSourcesShort)
                    {
                        try
                        {
                            EventLog.WriteEntry(string.Format("Adding new connector source: {0}", connectorSource.Id));
                        }
                        catch
                        {
                            //do nothing
                        }

                        // var childThread = new BackgroundUpdateThread(connectSourceService, connectorSource);
                        // New: specific to this cache
                        var childThread = new BackgroundUpdateThread(connectSourceService, connectorSource, CacheType.Short);

                        childThread.OnError += new EventHandler<ErrorEventArgs>(childThread_OnError);

                        // New: took out, don't do this, we're not using IsUpdateRunning boolean.
                        //IoC.Resolve<IConnectorSourceService>().UpdateConnectorSourceStatus(connectorSource.Id, true);

                        ChildThreads.Add(childThread);
                    }

                    foreach (var connectorSource in connectorSourcesMedium)
                    {
                        try
                        {
                            EventLog.WriteEntry(string.Format("Adding new connector source: {0}", connectorSource.Id));
                        }
                        catch
                        {
                            //do nothing
                        }

                        // var childThread = new BackgroundUpdateThread(connectSourceService, connectorSource);
                        // New: specific to this cache
                        var childThread = new BackgroundUpdateThread(connectSourceService, connectorSource, CacheType.Medium);

                        childThread.OnError += new EventHandler<ErrorEventArgs>(childThread_OnError);

                        // New: took out, don't do this, we're not using IsUpdateRunning boolean.
                        //IoC.Resolve<IConnectorSourceService>().UpdateConnectorSourceStatus(connectorSource.Id, true);

                        ChildThreads.Add(childThread);
                    }

                    foreach (var connectorSource in connectorSourcesLong)
                    {
                        try
                        {
                            EventLog.WriteEntry(string.Format("Adding new connector source: {0}", connectorSource.Id));
                        }
                        catch
                        {
                            //do nothing
                        }

                        // var childThread = new BackgroundUpdateThread(connectSourceService, connectorSource);
                        // New: specific to this cache
                        var childThread = new BackgroundUpdateThread(connectSourceService, connectorSource, CacheType.Longer);

                        childThread.OnError += new EventHandler<ErrorEventArgs>(childThread_OnError);

                        // New: took out, don't do this, we're not using IsUpdateRunning boolean.
                        //IoC.Resolve<IConnectorSourceService>().UpdateConnectorSourceStatus(connectorSource.Id, true);

                        ChildThreads.Add(childThread);
                    }
                                       
                    
                    EventLog.WriteEntry("DoCacheWork ChildThreads Start: " + DateTime.Now.ToString() + " --- ChildThreads Count:" + ChildThreads.Count, EventLogEntryType.Warning);

                    foreach (var item in ChildThreads)
                    {
                        try
                        {
                            item.Start();
                        }
                        catch (Exception ex)
                        {
                            EventLog.WriteEntry("BackgroundUpdate.cs DoCacheWork: " + ex.Message + " ----- " + ex.StackTrace, EventLogEntryType.Warning);

                        }
                    }

                }
                catch (Exception ex)
                {
                    try
                    {
                        EventLog.WriteEntry(ex.ToString(), EventLogEntryType.Error);
                    }
                    catch
                    {
                        //nothing can do here
                    }
                }
                if (_isRunning)
                {
                    Thread.Sleep(_mainThreadInterval);
                }
            }

        }
        #endregion

        void childThread_OnError(object sender, ErrorEventArgs e)
        {
            try
            {
                EventLog.WriteEntry(e.Message, EventLogEntryType.Error);
            }
            catch
            {
                // do nothing
            }
        }

        protected override void OnStop()
        {
            _isRunning = false;

            try
            {
                EventLog.WriteEntry("Stop Background Update service at " + DateTime.Now.ToString(), EventLogEntryType.Information);
            }
            catch
            {
                //do nothing
            }

            //wait for all childs stop
            try
            {
                foreach (var item in ChildThreads)
                {
                    item.Stop();
                }

                do
                {
                    ChildThreads.RemoveAll(au => au.IsRunning);
                    if (ChildThreads.Count > 0)
                        Thread.Sleep(1000);
                }
                while (ChildThreads.Count > 0);
            }
            finally
            {
                // force stop
                try
                {
                    MainThread.Abort();
                }
                catch
                {

                }
            }
        }
    }
}
