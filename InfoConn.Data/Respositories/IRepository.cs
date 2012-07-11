using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Entity;
using InfoConn.Core;

namespace InfoConn.Data
{
    public interface IRepository<T> where T : BaseEntity
    {
        T GetById(object id);
        void Insert(T entity);
        void Update(T entity);
        void Delete(T entity);
        void DeleteNotSubmit(T entity);
        void InsertNotSubmit(T entity);
        void Delete(List<T> entities);
        void SummitChange();
        IQueryable<T> Table { get; }
    }
}
