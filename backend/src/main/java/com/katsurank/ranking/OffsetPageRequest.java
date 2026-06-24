package com.katsurank.ranking;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * offset 기반 Pageable. Spring Data 의 PageRequest 는 page×size 로 offset 을 계산하므로,
 * offset 이 limit 의 배수가 아닐 때 잘못된 행을 가져온다. 이 구현은 offset 을 그대로 전달한다.
 */
final class OffsetPageRequest implements Pageable {

    private final int offset;
    private final int limit;

    OffsetPageRequest(int offset, int limit) {
        this.offset = offset;
        this.limit = limit;
    }

    @Override public int getPageNumber() { return offset / limit; }
    @Override public int getPageSize()   { return limit; }
    @Override public long getOffset()    { return offset; }
    @Override public Sort getSort()      { return Sort.unsorted(); }

    @Override public Pageable next()            { return new OffsetPageRequest(offset + limit, limit); }
    @Override public Pageable previousOrFirst() { return hasPrevious() ? new OffsetPageRequest(offset - limit, limit) : first(); }
    @Override public Pageable first()           { return new OffsetPageRequest(0, limit); }
    @Override public boolean hasPrevious()      { return offset >= limit; }
    @Override public Pageable withPage(int pageNumber) { return new OffsetPageRequest(pageNumber * limit, limit); }
}
