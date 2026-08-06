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
      
    
    



select total_deliveries
from `automobile_dw`.`fct_dealership_summary`
where total_deliveries is null



      
    ) dbt_internal_test