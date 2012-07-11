using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace InfoConn.Data.Services
{
    public interface IEventService
    {
        void SaveEvent(Core.Domain.Event @event);

        List<Core.Domain.Event> GetEvents(Core.Domain.DTO.SearchOption searchInfo);

        void SaveEvents(List<Core.Domain.Event> events, int connectSourceId, int ConnectorSourceType);

        void UpdateConnectorSource(int p, Core.Domain.CacheType cachType);
    }
}
