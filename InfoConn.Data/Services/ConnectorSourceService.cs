using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Data;
using InfoConn.Data.Respositories;
using InfoConn.Core.Domain;
using System.Data.Objects;

namespace InfoConn.Data.Services
{
    public class ConnectorSourceService : IConnectorSourceService
    {
        public IConnectorSourceRepository _connectorSourceRepository { get; set; }

        public ConnectorSourceService(IConnectorSourceRepository connectorSourceRepository)
        {
            this._connectorSourceRepository = connectorSourceRepository;
        }

        public int AddConnectorSource(ConnectorSource connectorSource)
        {
            var connectorSourceTest = GetConnectorSourcesByUserId(connectorSource.UserId, (ConnectorSourceType)connectorSource.ConnectorSourceType);
            if (connectorSourceTest == null)
            {
                _connectorSourceRepository.Insert(connectorSource);
                return connectorSource.Id;
            }
            else
            {
                UpdateConnectorSource(connectorSource);
                return connectorSourceTest.Id;
            }
        }

        public IEnumerable<ConnectorSource> GetConnectorSourcesByUserId(int userId)
        {
            return _connectorSourceRepository.Table.Where(es => es.UserId == userId);

        }

        public ConnectorSource GetConnectorSourcesByUserId(int userId, ConnectorSourceType sourceType)
        {
            return _connectorSourceRepository.Table.FirstOrDefault(es => es.UserId == userId && es.ConnectorSourceType == (int)sourceType);

        }

        public ConnectorSource GetConnectorSourcesById(int connectorSourceId)
        {
            return _connectorSourceRepository.GetById(connectorSourceId);
        }

        public void UpdateConnectorSource(ConnectorSource connectorSource)
        {
            var connectorSourceDB = GetConnectorSourcesById(connectorSource.Id);
            if (connectorSourceDB != null)
            {
                connectorSource.Username = connectorSource.Username;
                connectorSource.Password = connectorSource.Password;
                connectorSource.AccessToken = connectorSource.AccessToken;
                connectorSource.RefressToken = connectorSource.RefressToken;
                connectorSource.ExpiresDate = connectorSource.ExpiresDate;

                _connectorSourceRepository.Update(connectorSource);
            }
        }

        public void RemoveConnectorSource(int connectorSoureId)
        {
            var connectorSource = GetConnectorSourcesById(connectorSoureId);
            if (connectorSource != null)
                _connectorSourceRepository.Delete(connectorSource);
        }


        public List<ConnectorSource> GetConnectorSourceNeedToUpdateCache(int lastHour)
        {
            return _connectorSourceRepository.Table.Where(c => c.IsUpdateRunning && EntityFunctions.AddDays(c.LastModified,lastHour) < DateTime.Now).ToList();
        }

        public void UpdateConnectorSourceStatus(int connectorSourceId, bool isUpdateRunning)
        {
            var dbConnectorSource = _connectorSourceRepository.GetById(connectorSourceId);
            dbConnectorSource.IsUpdateRunning = isUpdateRunning;
            _connectorSourceRepository.Update(dbConnectorSource);
        }

        #region CACHING_CODE
        public List<ConnectorSource> GetConnectorSourceNeedToUpdateCache(CacheType cacheType, int hours)
        {
            List<ConnectorSource> _list = null;

            // Note: even though the Kuyam UI is presumably causing this to get called from background service,
            // it's important only to include those feeds that are out of date (e.g. must still use 'hours' value to filter)
            switch (cacheType)
            {
                case CacheType.Short: 
                    _list = _connectorSourceRepository.Table.Where(c => c.DoCacheUpdate_Short && 
                        EntityFunctions.AddDays(c.CacheLastUpdate_Short,hours) < DateTime.Now).ToList();
                    break;
                case CacheType.Medium:
                    _list = _connectorSourceRepository.Table.Where(c => c.DoCacheUpdate_Medium &&
                        EntityFunctions.AddDays(c.CacheLastUpdate_Medium, hours) < DateTime.Now).ToList();
                    break;
                case CacheType.Longer:
                    _list = _connectorSourceRepository.Table.Where(c => c.DoCacheUpdate_Longer &&
                       EntityFunctions.AddDays(c.CacheLastUpdate_Longer, hours) < DateTime.Now).ToList();
                    break;
            }
            return _list;
        }

        // Toggle the Connector Sources so that this source gets processed by the background service the next time it runs.
        public void UpdateConnectorSourceStatus(int connectorSourceId, bool isUpdateRunning, CacheType cacheType)
        {
            using (InfoConn.Data.DBML.InfoConnDBEntities context = new InfoConn.Data.DBML.InfoConnDBEntities())
            {
                var dbConnectorSource = context.ConnectorSources.Where(s => s.Id == connectorSourceId).FirstOrDefault();

                // Do not do this in this version of the function!
                //dbConnectorSource.IsUpdateRunning = isUpdateRunning;

                // Set only the specific cache we want updated.
                switch (cacheType)
                {
                    case CacheType.Short:
                        dbConnectorSource.CacheLastUpdate_Short = DateTime.Now;
                        dbConnectorSource.DoCacheUpdate_Short = isUpdateRunning;
                        break;
                    case CacheType.Medium:
                        dbConnectorSource.CacheLastUpdate_Medium = DateTime.Now;
                        dbConnectorSource.DoCacheUpdate_Medium = isUpdateRunning;
                        break;
                    case CacheType.Longer:
                        dbConnectorSource.CacheLastUpdate_Longer = DateTime.Now;
                        dbConnectorSource.DoCacheUpdate_Longer = isUpdateRunning;
                        break;
                }
                context.SaveChanges();
            }
        }
        #endregion
    }
}
