select
      count(*) as failures,
      case
        when count(*) <> 0 then 'true'
        else 'false'
      end as should_warn,
      case
        when count(*) <> 0 then 'true'
        else 'false'
      end as should_error
    from (
      
    
    

select
    lead_id as unique_field,
    count(*) as n_records

from `automobile_dw`.`stg_fact_delivery`
where lead_id is not null
group by lead_id
having count(*) > 1



      
    ) dbt_internal_test