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
      
    
    



select date_of_actual_delivery
from `automobile_dw`.`stg_fact_delivery`
where date_of_actual_delivery is null



      
    ) dbt_internal_test