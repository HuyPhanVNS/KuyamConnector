using InfoConn.Config;
using InfoConn.Connector.Facebook;
using InfoConn.Connector.ICalendar;
using InfoConn.Core;
using InfoConn.Core.Domain;
using InfoConn.Core.Exceptions;
using InfoConn.Data.Services;
using InfoLib.GoogleConnector;
using InfoConn.Connector.ICalendar;

namespace InfoConn.Service
{
    public class ConnectorManager : IConnectorManager
    {
        readonly ISettingService _settingService;
        readonly IEventService _eventService;
        readonly ICalendarService _calendarService;
        readonly IConnectorSourceService _connectorSourceService;
        public ConnectorManager(ISettingService settingService,
            IConnectorSourceService connectorSourceService,
            ICalendarService calendarService,
            IEventService eventService)
        {
            this._settingService = settingService;
            this._eventService = eventService;
            this._calendarService = calendarService;
            this._connectorSourceService = connectorSourceService;
        }

        public ConnectorBase GetConnector(ConnectorSourceType sourceType)
        {
            switch (sourceType)
            {
                case ConnectorSourceType.Facebook:
                    return new FacebookConnector(_settingService, _eventService, _connectorSourceService);
                case ConnectorSourceType.Google:
                    return new GoogleConnector(_settingService, _eventService, _calendarService, _connectorSourceService);
                case ConnectorSourceType.iCalendar:
                    return new ICalendarConnector(_eventService);
            }

            throw new ConnectorException(string.Format("Connector for {0} could not be found!", sourceType.ToString()));
        }

        public ConnectorBase GetConnector(ConnectorSource connectorSource)
        {
            ConnectorSourceType sourceType = (ConnectorSourceType)connectorSource.ConnectorSourceType;
            var result = GetConnector(sourceType);
            result.Init(connectorSource);

            return result;
        }

    }
}
