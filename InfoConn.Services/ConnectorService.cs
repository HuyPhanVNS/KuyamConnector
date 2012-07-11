using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core;
using InfoConn.Connector.Facebook;
using InfoLib.GoogleConnector;
using InfoConn.Core.Exceptions;

using InfoConn.Config;
using InfoConn.Data.Services;
using InfoConn.Connector.ICalendar;
using InfoConn.Core.Domain.DTO;
using InfoConn.Core.Domain;

namespace InfoConn.Service
{
    public class ConnectorService : IConnectorService
    {        
        private IConnectorSourceService _connectorSourceService;
        private IConnectorManager _connectorManager;

        public ConnectorService(IConnectorSourceService connectorSourceService, IConnectorManager connectorManager)
        {
            this._connectorSourceService = connectorSourceService;
            this._connectorManager = connectorManager;
        }


        /// <summary>
        /// Gets list of event
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="seachOption"></param>
        /// <returns></returns>
        public List<Event> GetEvents(int userId, SearchOption seachOption, ConnectorSourceType connectorSourceType)
        {
            List<Event> result = new List<Event>();
            var connectorSource = _connectorSourceService.GetConnectorSourcesByUserId(userId, connectorSourceType);
            if (connectorSource != null)
            {
                var connector = _connectorManager.GetConnector(connectorSource);
                if (connector != null)
                {
                    // hot fix
                    seachOption.UId = userId;
                    result = connector.GetEvents(seachOption);
                }
            }

            return result;
        }

        public bool SaveEvents(int userId, SearchOption seachOption, ConnectorSourceType connectorSourceType)
        {
            bool result = false;
            var connectorSource = _connectorSourceService.GetConnectorSourcesByUserId(userId, connectorSourceType);
            if (connectorSource != null)
            {
                var connector = _connectorManager.GetConnector(connectorSource);
                if (connector != null)
                {
                    result =connector.SaveEvents(seachOption);
                }
            }

            return result;
        }

        /// <summary>
        /// Get event
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="eventId"></param>
        /// <returns></returns>
        public Event GetEvent(int userId, string eventId, string calendarId, ConnectorSourceType connectorSourceType)
        {
            var result = new Event();
            var connectorSource = _connectorSourceService.GetConnectorSourcesByUserId(userId, connectorSourceType);
            if (connectorSource != null)
            {
                var connector = _connectorManager.GetConnector(connectorSource);
                if (connector != null)
                {
                    result = connector.GetEvent(userId, eventId, calendarId);
                }
            }
            return result;
        }

        public List<Event> GetEvent(int userId, DateTime startDate, DateTime endDate, ConnectorSourceType sourceType)
        {
            throw new Exception("Not Implemented");
        }

        public bool DeleteEvent(int userId, string eventId, string calendarId, ConnectorSourceType sourceType)
        {
            var connectorSources = _connectorSourceService.GetConnectorSourcesByUserId(userId, sourceType);
            var connector = _connectorManager.GetConnector(connectorSources);
            var result = false;
            if (connector != null)
            {
                result = connector.DeleteEvent(userId, eventId, calendarId);
            }
            return result;
        }

        public string PostEvent(int userId, ConnectorSourceType connectorSourceType, Event postEventPara)
        {
            var connectorSource = _connectorSourceService.GetConnectorSourcesByUserId(userId, connectorSourceType);
            string result = string.Empty;

            var connector = _connectorManager.GetConnector(connectorSource);
            if (connector != null)
            {
                result = connector.PostEvent(userId, connectorSourceType, postEventPara);
            }

            return result;
        }
        public List<Calendar> GetCalendars(int userId, ConnectorSourceType connectorSourceType)
        {
            List<Calendar> result = new List<Calendar>();
            var connectorSource = _connectorSourceService.GetConnectorSourcesByUserId(userId, connectorSourceType);
            if (connectorSource != null)
            {
                var connector = _connectorManager.GetConnector(connectorSource);
                if (connector != null)
                {
                    result.AddRange(connector.GetCalendars());
                }
            }

            return result;
        }

        /// <summary>
        /// Get calendar
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="connectorSourceType"></param>
        /// <param name="calendarId"></param>
        /// <returns></returns>
        public Calendar GetCalendar(int userId, ConnectorSourceType connectorSourceType, string calendarId)
        {
            var result = new Calendar();
            var connectorSource = _connectorSourceService.GetConnectorSourcesByUserId(userId, connectorSourceType);
            if (connectorSource != null)
            {
                var connector = _connectorManager.GetConnector(connectorSource);

                if (connector != null)
                {
                    result = connector.GetCalendar(calendarId);
                }
            }

            return result;
        }

        /// <summary>
        /// Add connector source
        /// </summary>
        /// <param name="connectorSource"></param>
        /// <returns></returns>
        public int AddConnectorSource(ConnectorSource connectorSource)
        {
            return _connectorSourceService.AddConnectorSource(connectorSource);
        }

        /// <summary>
        /// Update connector source
        /// </summary>
        /// <param name="connectorSourceId">Id of connector source to update</param>
        /// <param name="username"></param>
        /// <param name="password"></param>
        /// <param name="accessToken"></param>
        /// <param name="refressAccessToken"></param>
        /// <param name="expriesDate"></param>
        public void UpdateConnectorSource(ConnectorSource connectorSource)
        {
            _connectorSourceService.UpdateConnectorSource(connectorSource);
        }

        /// <summary>
        /// Remove connector source
        /// </summary>
        /// <param name="connectorSoureId">Id of connector source to remove</param>
        public void RemoveConnectorSource(int connectorSoureId)
        {
            _connectorSourceService.RemoveConnectorSource(connectorSoureId);
        }

        public ConnectorSource GetConnectorSource(int userId, ConnectorSourceType connectorSouceType)
        {
            return _connectorSourceService.GetConnectorSourcesByUserId(userId, connectorSouceType);
        }

        //public void UpdateCache(ConnectorSource connectorSource)
        //{
        //    if (connectorSource != null)
        //    {
        //        var connector = _connectorManager.GetConnector(connectorSource);

        //        if (connector != null)
        //        {
        //            connector.UpdateCache(connectorSource.);
        //        }
        //    }
        //}

        public void UpdateCache(ConnectorSource connectorSource, CacheType cacheType)
        {
            if (connectorSource != null)
            {
                var connector = _connectorManager.GetConnector(connectorSource);

                if (connector != null)
                {
                    connector.UpdateCache(connectorSource.Id, cacheType);
                }
            }
        } 
    }
}
