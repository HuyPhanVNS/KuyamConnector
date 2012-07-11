using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using InfoConn.Core;
using InfoConn.Core.Domain;
using System.Diagnostics;
using System.Configuration;

namespace InfoConn.BackgroundUpdateService
{
    public class BackgroundUpdateThread
    {
        EventLog _eventLog;
        public EventLog EventLog
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


        #region Properties

        public Thread UpdateThread { private get; set; }

        public ConnectorSource ConnectorSource { get; set; }

        IConnectorService _connectorService { get; set; }

        #endregion

        #region CACHING_CODE
        CacheType _cacheType;

        public BackgroundUpdateThread(IConnectorService connectorService, ConnectorSource connectorSource, CacheType cacheType)
        {
            this._cacheType = cacheType;
            this.ConnectorSource = connectorSource;
            this._connectorService = connectorService;
            IsRunning = true;
            UpdateThread = new Thread(new ParameterizedThreadStart(DoWork));
        }
        #endregion

        /*
        public BackgroundUpdateThread(IConnectorService connectorService, ConnectorSource connectorSource)
        {
            this.ConnectorSource = connectorSource;
            this._connectorService = connectorService;
            IsRunning = true;
            UpdateThread = new Thread(new ParameterizedThreadStart(DoWork));
        }
        */
        event EventHandler<ErrorEventArgs> _onError;
        public event EventHandler<ErrorEventArgs> OnError
        {
            add
            {
                _onError += value;
            }
            remove
            {
                _onError -= value;
            }
        }

        public bool IsRunning { get; set; }

        public void Start()
        {
            try
            {                
                UpdateThread.Start();
            }
            catch (Exception ex)
            {
                EventLog.WriteEntry("BackgroundUpdateThread Start: " + ex.Message + " ----- " + ex.StackTrace, EventLogEntryType.Warning);
            }
        }

        public void Stop()
        {
            UpdateThread.Abort() ;
        }

        #region CACHING_CODE
        public void DoWork(object obj)
        {
            IsRunning = true;

            //_connectorService.UpdateCache(ConnectorSource);
            // New: now passing cache type to update code
            // TODO: change UpdateCache() to accept cachetype. Use that to modify the date range updated in DB.
            try
            {
                EventLog.WriteEntry("BackgroundUpdateThread DoWork: UpdateCache started", EventLogEntryType.Warning);
                _connectorService.UpdateCache(ConnectorSource, this._cacheType);
            }
            catch (Exception ex)
            {
                EventLog.WriteEntry("BackgroundUpdateThread DoWork: " + ex.Message + " ----- " + ex.StackTrace, EventLogEntryType.Warning);
            }
            EventLog.WriteEntry("BackgroundUpdateThread DoWork: UpdateCache finished", EventLogEntryType.Warning);
            UpdateThread.Join();
            IsRunning = false;
        }
        #endregion
    }

    public class ErrorEventArgs : EventArgs
    {
        public string Message { get; set; }

        public ErrorEventArgs(string message)
        {
            this.Message = message;
        }
    }
}
