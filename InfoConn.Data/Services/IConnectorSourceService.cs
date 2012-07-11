using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core;
using InfoConn.Core.Domain;

namespace InfoConn.Data.Services
{
    public interface IConnectorSourceService
    {
        ConnectorSource GetConnectorSourcesById(int connectorSourceId);
        IEnumerable<ConnectorSource> GetConnectorSourcesByUserId(int userId);
        ConnectorSource GetConnectorSourcesByUserId(int userId, ConnectorSourceType sourceType);

        int AddConnectorSource(ConnectorSource connectorSource);
        void UpdateConnectorSource(ConnectorSource connectorSource);
        void RemoveConnectorSource(int connectorSoureId);

        List<ConnectorSource> GetConnectorSourceNeedToUpdateCache(int lastHour);

        void UpdateConnectorSourceStatus(int connectorSourceId, bool isRunningUpdate);

        #region CACHING_CODE
        List<ConnectorSource> GetConnectorSourceNeedToUpdateCache(CacheType cacheType, int hours);
        void UpdateConnectorSourceStatus(int connectorSourceId, bool isRunningUpdate, CacheType cacheType);
        #endregion
    }
}
