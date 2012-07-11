using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core.Domain.DTO;
using InfoConn.Core.Domain;

namespace InfoConn.Core
{
    public interface IConnectorService
    {

        bool SaveEvents(int userId, SearchOption searchInfo, ConnectorSourceType sourceType);

        List<Event> GetEvents(int userId, SearchOption searchInfo, ConnectorSourceType sourceType);
        string PostEvent(int userId, ConnectorSourceType sourceType, Event postEventPara);
        bool DeleteEvent(int userId, string eventId, string calendarId, ConnectorSourceType sourceType);
        Event GetEvent(int userId, string eventId, string calendarId, ConnectorSourceType sourceType);
        List<Calendar> GetCalendars(int userId, ConnectorSourceType sourceType);
        Calendar GetCalendar(int userId, ConnectorSourceType sourceType, string calendarId);

        /// <summary>
        /// Add connector source
        /// </summary>
        /// <param name="connectorSouce"></param>        
        /// <returns>Connector source Id</returns>
        ConnectorSource GetConnectorSource(int userId, ConnectorSourceType connectorSouceType);

        /// <summary>
        /// Add connector source
        /// </summary>
        /// <param name="connectorSouce"></param>        
        /// <returns>Connector source Id</returns>
        int AddConnectorSource(ConnectorSource connectorSouce);

        /// <summary>
        /// Update connector source in case use has change source or authorize error
        /// </summary>
        /// <param name="connectorSouce"></param>        
        /// <returns></returns>
        void UpdateConnectorSource(ConnectorSource connectorSouce);

        /// <summary>
        /// Remove connector source when user don't want connect to thier CC
        /// </summary>
        /// <param name="connectorSoureId"></param>
        /// <returns></returns>
        void RemoveConnectorSource(int connectorSoureId);

        //void UpdateCache(ConnectorSource ConnectorSource);

        void UpdateCache(ConnectorSource ConnectorSource, CacheType cacheType);

        List<Event> GetEvent(int userId, DateTime startDate, DateTime endDate, ConnectorSourceType sourceType);
    } 
}
